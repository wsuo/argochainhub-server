import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { SampleRequest, SampleRequestStatus } from '../entities/sample-request.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Company, CompanyType } from '../entities/company.entity';
import { User, UserType } from '../entities/user.entity';
import { Notification, NotificationType } from '../entities/notification.entity';
import { NotificationGateway } from '../notifications/notification.gateway';
import { PaginatedResult } from '../common/dto/pagination.dto';
import {
  CreateSampleRequestDto,
  GetSampleRequestsDto,
  CancelSampleRequestDto,
  ConfirmDeliveryDto,
  EvaluateSampleDto,
  ApproveSampleRequestDto,
  RejectSampleRequestDto,
  ShipSampleRequestDto,
} from './dto/sample-request.dto';

@Injectable()
export class SamplesService {
  constructor(
    @InjectRepository(SampleRequest)
    private readonly sampleRequestRepository: Repository<SampleRequest>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // 生成样品申请编号
  private async generateSampleRequestNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const prefix = `SR${year}${month}${day}`;
    
    // 查找今天的最后一个编号
    const lastRequest = await this.sampleRequestRepository
      .createQueryBuilder('sr')
      .where('sr.sampleReqNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('sr.sampleReqNo', 'DESC')
      .getOne();
    
    let sequence = 1;
    if (lastRequest) {
      const lastSequence = parseInt(lastRequest.sampleReqNo.slice(-2));
      sequence = lastSequence + 1;
    }
    
    return `${prefix}${String(sequence).padStart(2, '0')}`;
  }

  // 创建样品申请（采购商）
  async createSampleRequest(
    user: User,
    createDto: CreateSampleRequestDto,
  ): Promise<SampleRequest> {
    // 验证用户类型
    if (user.userType !== UserType.INDIVIDUAL_BUYER) {
      throw new ForbiddenException('只有采购商可以申请样品');
    }

    // 验证产品存在且属于指定供应商
    const product = await this.productRepository.findOne({
      where: { 
        id: createDto.productId,
        supplierId: createDto.supplierId,
        status: ProductStatus.ACTIVE
      },
    });

    if (!product) {
      throw new NotFoundException('产品不存在或不属于该供应商');
    }

    // 创建产品快照
    const productSnapshot = {
      name: JSON.stringify(product.name),
      category: product.pesticideName ? JSON.stringify(product.pesticideName) : '',
      formulation: product.formulation || '',
      activeIngredient: product.activeIngredient1 ? JSON.stringify(product.activeIngredient1) : '',
      content: product.totalContent || '',
    };

    // 生成申请编号
    const sampleReqNo = await this.generateSampleRequestNo();

    // 创建样品申请
    const sampleRequest = this.sampleRequestRepository.create({
      sampleReqNo,
      buyerId: user.companyId || user.id,
      supplierId: createDto.supplierId,
      productId: createDto.productId,
      quantity: createDto.quantity,
      unit: createDto.unit,
      deadline: new Date(createDto.deadline),
      details: createDto.details,
      productSnapshot,
      status: SampleRequestStatus.PENDING_APPROVAL,
    });

    const savedRequest = await this.sampleRequestRepository.save(sampleRequest);

    // 发送通知给供应商
    await this.notifySupplier(savedRequest, NotificationType.SAMPLE_REQUEST_NEW);

    return savedRequest;
  }

  // 获取我的样品申请列表（采购商）
  async getMySampleRequests(
    user: User,
    queryDto: GetSampleRequestsDto,
  ): Promise<PaginatedResult<SampleRequest>> {
    const { page = 1, limit = 20, status, supplierId, keyword, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const query = this.sampleRequestRepository
      .createQueryBuilder('sr')
      .leftJoinAndSelect('sr.supplier', 'supplier')
      .leftJoinAndSelect('sr.product', 'product')
      .where('sr.buyerId = :buyerId', { buyerId: user.companyId || user.id });

    if (status) {
      query.andWhere('sr.status = :status', { status });
    }

    if (supplierId) {
      query.andWhere('sr.supplierId = :supplierId', { supplierId });
    }

    if (keyword) {
      query.andWhere('(sr.sampleReqNo LIKE :keyword OR product.name LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const totalItems = await query.getCount();
    const totalPages = Math.ceil(totalItems / limit);

    const data = await query
      .orderBy(`sr.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    };
  }

  // 获取样品申请详情
  async getSampleRequestDetail(id: number, user: User): Promise<SampleRequest> {
    const sampleRequest = await this.sampleRequestRepository.findOne({
      where: { id },
      relations: ['buyer', 'supplier', 'product'],
    });

    if (!sampleRequest) {
      throw new NotFoundException('样品申请不存在');
    }

    // 权限检查：只有相关方可以查看
    const isBuyer = sampleRequest.buyerId === (user.companyId || user.id);
    const isSupplier = sampleRequest.supplierId === user.companyId;

    if (!isBuyer && !isSupplier) {
      throw new ForbiddenException('无权查看此样品申请');
    }

    return sampleRequest;
  }

  // 取消样品申请（采购商）
  async cancelSampleRequest(
    id: number,
    user: User,
    cancelDto: CancelSampleRequestDto,
  ): Promise<SampleRequest> {
    const sampleRequest = await this.getSampleRequestDetail(id, user);

    // 只有待审核和已批准状态可以取消
    if (!['pending_approval', 'approved'].includes(sampleRequest.status)) {
      throw new BadRequestException('当前状态不允许取消');
    }

    // 只有采购商可以取消
    if (sampleRequest.buyerId !== (user.companyId || user.id)) {
      throw new ForbiddenException('只有采购商可以取消样品申请');
    }

    sampleRequest.status = SampleRequestStatus.CANCELLED;
    sampleRequest.details = {
      ...sampleRequest.details,
      cancelReason: cancelDto.reason,
      cancelledAt: new Date().toISOString(),
    };

    const updatedRequest = await this.sampleRequestRepository.save(sampleRequest);

    // 通知供应商
    await this.notifySupplier(updatedRequest, NotificationType.SYSTEM);

    return updatedRequest;
  }

  // 确认收货（采购商）
  async confirmDelivery(
    id: number,
    user: User,
    confirmDto: ConfirmDeliveryDto,
  ): Promise<SampleRequest> {
    const sampleRequest = await this.getSampleRequestDetail(id, user);

    // 只有已发货状态可以确认收货
    if (sampleRequest.status !== SampleRequestStatus.SHIPPED) {
      throw new BadRequestException('只有已发货状态可以确认收货');
    }

    // 只有采购商可以确认收货
    if (sampleRequest.buyerId !== (user.companyId || user.id)) {
      throw new ForbiddenException('只有采购商可以确认收货');
    }

    sampleRequest.status = SampleRequestStatus.DELIVERED;
    sampleRequest.details = {
      ...sampleRequest.details,
      deliveryInfo: {
        receivedAt: confirmDto.receivedAt,
        condition: confirmDto.condition,
        notes: confirmDto.notes,
        images: confirmDto.images,
      },
    };

    const updatedRequest = await this.sampleRequestRepository.save(sampleRequest);

    // 通知供应商
    await this.notifySupplier(updatedRequest, NotificationType.SAMPLE_REQUEST_DELIVERED);

    return updatedRequest;
  }

  // 获取收到的样品申请（供应商）
  async getSupplierSampleRequests(
    user: User,
    queryDto: GetSampleRequestsDto,
  ): Promise<PaginatedResult<SampleRequest>> {
    // 验证用户是供应商
    if (user.userType !== UserType.SUPPLIER || !user.companyId) {
      throw new ForbiddenException('只有供应商可以查看收到的样品申请');
    }

    const { page = 1, limit = 20, status, keyword, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const query = this.sampleRequestRepository
      .createQueryBuilder('sr')
      .leftJoinAndSelect('sr.buyer', 'buyer')
      .leftJoinAndSelect('sr.product', 'product')
      .where('sr.supplierId = :supplierId', { supplierId: user.companyId });

    if (status) {
      query.andWhere('sr.status = :status', { status });
    }

    if (keyword) {
      query.andWhere('(sr.sampleReqNo LIKE :keyword OR product.name LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const totalItems = await query.getCount();
    const totalPages = Math.ceil(totalItems / limit);

    const data = await query
      .orderBy(`sr.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    };
  }

  // 批准样品申请（供应商）
  async approveSampleRequest(
    id: number,
    user: User,
    approveDto: ApproveSampleRequestDto,
  ): Promise<SampleRequest> {
    const sampleRequest = await this.getSampleRequestDetail(id, user);

    // 只有待审核状态可以批准
    if (sampleRequest.status !== SampleRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审核状态可以批准');
    }

    // 只有供应商可以批准
    if (sampleRequest.supplierId !== user.companyId) {
      throw new ForbiddenException('只有供应商可以批准样品申请');
    }

    sampleRequest.status = SampleRequestStatus.APPROVED;
    sampleRequest.details = {
      ...sampleRequest.details,
      approvalInfo: {
        approvedAt: new Date().toISOString(),
        approvedBy: user.name,
        notes: approveDto.notes,
        estimatedShipDate: approveDto.estimatedShipDate,
      },
    };

    const updatedRequest = await this.sampleRequestRepository.save(sampleRequest);

    // 通知采购商
    await this.notifyBuyer(updatedRequest, NotificationType.SAMPLE_REQUEST_APPROVED);

    return updatedRequest;
  }

  // 拒绝样品申请（供应商）
  async rejectSampleRequest(
    id: number,
    user: User,
    rejectDto: RejectSampleRequestDto,
  ): Promise<SampleRequest> {
    const sampleRequest = await this.getSampleRequestDetail(id, user);

    // 只有待审核状态可以拒绝
    if (sampleRequest.status !== SampleRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('只有待审核状态可以拒绝');
    }

    // 只有供应商可以拒绝
    if (sampleRequest.supplierId !== user.companyId) {
      throw new ForbiddenException('只有供应商可以拒绝样品申请');
    }

    sampleRequest.status = SampleRequestStatus.REJECTED;
    sampleRequest.details = {
      ...sampleRequest.details,
      rejectionInfo: {
        rejectedAt: new Date().toISOString(),
        rejectedBy: user.name,
        reason: rejectDto.reason,
      },
    };

    const updatedRequest = await this.sampleRequestRepository.save(sampleRequest);

    // 通知采购商
    await this.notifyBuyer(updatedRequest, NotificationType.SAMPLE_REQUEST_REJECTED);

    return updatedRequest;
  }

  // 发货（供应商）
  async shipSampleRequest(
    id: number,
    user: User,
    shipDto: ShipSampleRequestDto,
  ): Promise<SampleRequest> {
    const sampleRequest = await this.getSampleRequestDetail(id, user);

    // 只有已批准状态可以发货
    if (sampleRequest.status !== SampleRequestStatus.APPROVED) {
      throw new BadRequestException('只有已批准状态可以发货');
    }

    // 只有供应商可以发货
    if (sampleRequest.supplierId !== user.companyId) {
      throw new ForbiddenException('只有供应商可以发货');
    }

    sampleRequest.status = SampleRequestStatus.SHIPPED;
    sampleRequest.trackingInfo = {
      carrier: shipDto.carrier,
      trackingNumber: shipDto.trackingNumber,
    };
    sampleRequest.details = {
      ...sampleRequest.details,
      shippingInfo: {
        shippedAt: new Date().toISOString(),
        shippedBy: user.name,
        notes: shipDto.notes,
      },
    };

    const updatedRequest = await this.sampleRequestRepository.save(sampleRequest);

    // 通知采购商
    await this.notifyBuyer(updatedRequest, NotificationType.SAMPLE_REQUEST_SHIPPED);

    return updatedRequest;
  }

  // 获取统计数据
  async getSampleRequestStats(user: User): Promise<any> {
    const isBuyer = user.userType === UserType.INDIVIDUAL_BUYER;
    const whereCondition = isBuyer
      ? { buyerId: user.companyId || user.id }
      : { supplierId: user.companyId };

    const [
      total,
      pendingApproval,
      approved,
      shipped,
      delivered,
      rejected,
      cancelled,
    ] = await Promise.all([
      this.sampleRequestRepository.count({ where: whereCondition }),
      this.sampleRequestRepository.count({ where: { ...whereCondition, status: SampleRequestStatus.PENDING_APPROVAL } }),
      this.sampleRequestRepository.count({ where: { ...whereCondition, status: SampleRequestStatus.APPROVED } }),
      this.sampleRequestRepository.count({ where: { ...whereCondition, status: SampleRequestStatus.SHIPPED } }),
      this.sampleRequestRepository.count({ where: { ...whereCondition, status: SampleRequestStatus.DELIVERED } }),
      this.sampleRequestRepository.count({ where: { ...whereCondition, status: SampleRequestStatus.REJECTED } }),
      this.sampleRequestRepository.count({ where: { ...whereCondition, status: SampleRequestStatus.CANCELLED } }),
    ]);

    return {
      total,
      pendingApproval,
      approved,
      shipped,
      delivered,
      rejected,
      cancelled,
    };
  }

  // 通知采购商
  private async notifyBuyer(
    sampleRequest: SampleRequest,
    notificationType: NotificationType,
  ): Promise<void> {
    // 查找采购商的所有用户
    const buyerUsers = await this.userRepository.find({
      where: { companyId: sampleRequest.buyerId },
    });

    // 创建通知
    const notifications = buyerUsers.map(user => {
      const title = this.getNotificationTitle(notificationType);
      const content = this.getNotificationContent(notificationType, sampleRequest);

      return this.notificationRepository.create({
        userId: user.id,
        type: notificationType,
        title,
        content,
        data: {
          relatedId: sampleRequest.id,
          relatedType: 'sample_request',
          sampleReqNo: sampleRequest.sampleReqNo,
        },
      });
    });

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);

      // WebSocket推送
      for (const notification of notifications) {
        await this.notificationGateway.sendNotificationToUser(notification.userId, notification);
      }
    }
  }

  // 通知供应商
  private async notifySupplier(
    sampleRequest: SampleRequest,
    notificationType: NotificationType,
  ): Promise<void> {
    // 查找供应商的所有用户
    const supplierUsers = await this.userRepository.find({
      where: { companyId: sampleRequest.supplierId },
    });

    // 创建通知
    const notifications = supplierUsers.map(user => {
      const title = this.getNotificationTitle(notificationType);
      const content = this.getNotificationContent(notificationType, sampleRequest);

      return this.notificationRepository.create({
        userId: user.id,
        type: notificationType,
        title,
        content,
        data: {
          relatedId: sampleRequest.id,
          relatedType: 'sample_request',
          sampleReqNo: sampleRequest.sampleReqNo,
        },
      });
    });

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);

      // WebSocket推送
      for (const notification of notifications) {
        await this.notificationGateway.sendNotificationToUser(notification.userId, notification);
      }
    }
  }

  // 获取通知标题
  private getNotificationTitle(type: NotificationType): string {
    const titles = {
      [NotificationType.SAMPLE_REQUEST_NEW]: '新样品申请',
      [NotificationType.SAMPLE_REQUEST_APPROVED]: '样品申请已批准',
      [NotificationType.SAMPLE_REQUEST_REJECTED]: '样品申请被拒绝',
      [NotificationType.SAMPLE_REQUEST_SHIPPED]: '样品已发货',
      [NotificationType.SAMPLE_REQUEST_DELIVERED]: '样品已送达',
      [NotificationType.SYSTEM]: '系统通知',
    };
    return titles[type] || '系统通知';
  }

  // 获取通知内容
  private getNotificationContent(type: NotificationType, sampleRequest: SampleRequest): string {
    const contents = {
      [NotificationType.SAMPLE_REQUEST_NEW]: `您收到新的样品申请 ${sampleRequest.sampleReqNo}`,
      [NotificationType.SAMPLE_REQUEST_APPROVED]: `您的样品申请 ${sampleRequest.sampleReqNo} 已被批准`,
      [NotificationType.SAMPLE_REQUEST_REJECTED]: `您的样品申请 ${sampleRequest.sampleReqNo} 被拒绝`,
      [NotificationType.SAMPLE_REQUEST_SHIPPED]: `样品 ${sampleRequest.sampleReqNo} 已发货，请注意查收`,
      [NotificationType.SAMPLE_REQUEST_DELIVERED]: `样品 ${sampleRequest.sampleReqNo} 已确认收货`,
      [NotificationType.SYSTEM]: `样品申请 ${sampleRequest.sampleReqNo} 状态已更新`,
    };
    return contents[type] || `样品申请 ${sampleRequest.sampleReqNo} 有新的更新`;
  }
}