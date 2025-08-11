import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RegistrationRequest, RegistrationRequestStatus } from '../entities/registration-request.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { Product } from '../entities/product.entity';
import { PaginatedResult } from '../common/dto/pagination.dto';
import {
  CreateRegistrationRequestDto,
  QueryRegistrationRequestDto,
  UpdateRegistrationProgressDto,
  RejectRegistrationRequestDto,
} from './dto/registration-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class RegistrationRequestsService {
  constructor(
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 创建登记申请（采购商）
   */
  async createRegistrationRequest(
    user: User,
    createDto: CreateRegistrationRequestDto,
  ): Promise<RegistrationRequest> {
    // 验证用户企业信息
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以创建登记申请');
    }

    // 验证产品是否存在
    const product = await this.productRepository.findOne({
      where: { id: createDto.productId, supplierId: createDto.supplierId },
    });

    if (!product) {
      throw new NotFoundException('产品不存在或不属于指定供应商');
    }

    // 生成登记申请单号
    const regReqNo = this.generateRegistrationRequestNo();

    // 创建产品快照
    const productSnapshot = {
      name: product.name?.['zh-CN'] || '未知产品',
      category: '农药', // 默认分类
      formulation: product.formulation || '',
      activeIngredient: product.activeIngredient1?.name?.['zh-CN'] || '',
      content: product.totalContent || '',
    };

    // 创建登记申请
    const registrationRequest = this.registrationRequestRepository.create({
      regReqNo,
      buyerId: user.companyId,
      supplierId: createDto.supplierId,
      productId: createDto.productId,
      deadline: createDto.deadline
        ? new Date(createDto.deadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天
      details: {
        targetCountry: createDto.targetCountry,
        isExclusive: createDto.isExclusive,
        docReqs: createDto.docReqs,
        sampleReq: createDto.sampleReq,
        timeline: createDto.timeline,
        budget: createDto.budgetAmount
          ? {
              amount: createDto.budgetAmount,
              currency: createDto.budgetCurrency || 'USD',
            }
          : undefined,
        additionalRequirements: createDto.additionalRequirements,
      },
      productSnapshot,
      status: RegistrationRequestStatus.PENDING_RESPONSE,
    });

    const savedRequest = await this.registrationRequestRepository.save(registrationRequest);

    // 发送通知给供应商
    const supplierUsers = await this.userRepository.find({
      where: { companyId: createDto.supplierId },
    });

    for (const supplierUser of supplierUsers) {
      await this.notificationsService.createNotificationForUser(
        supplierUser.id,
        NotificationType.REGISTRATION_REQUEST_NEW,
        '新的登记申请',
        `您收到了一个新的登记申请，申请单号：${regReqNo}`,
        {
          relatedId: savedRequest.id,
          relatedType: 'registration_request',
          actionUrl: `/registration-requests/received/${savedRequest.id}`,
        },
      );
    }

    return savedRequest;
  }

  /**
   * 查询我的登记申请（采购商）
   */
  async getMyRegistrationRequests(
    user: User,
    queryDto: QueryRegistrationRequestDto,
  ): Promise<PaginatedResult<RegistrationRequest>> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以查询登记申请');
    }

    const { page = 1, limit = 20 } = queryDto;

    const queryBuilder = this.createQueryBuilder(queryDto);
    queryBuilder.andWhere('registrationRequest.buyerId = :buyerId', {
      buyerId: user.companyId,
    });

    const [data, totalItems] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit,
      },
    };
  }

  /**
   * 查询收到的登记申请（供应商）
   */
  async getReceivedRegistrationRequests(
    user: User,
    queryDto: QueryRegistrationRequestDto,
  ): Promise<PaginatedResult<RegistrationRequest>> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以查询登记申请');
    }

    // 验证是否为供应商
    const company = await this.companyRepository.findOne({
      where: { id: user.companyId },
    });

    if (!company || company.type !== 'supplier') {
      throw new ForbiddenException('只有供应商可以查询收到的登记申请');
    }

    const { page = 1, limit = 20 } = queryDto;

    const queryBuilder = this.createQueryBuilder(queryDto);
    queryBuilder.andWhere('registrationRequest.supplierId = :supplierId', {
      supplierId: user.companyId,
    });

    const [data, totalItems] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        itemsPerPage: limit,
      },
    };
  }

  /**
   * 获取登记申请详情
   */
  async getRegistrationRequestById(
    user: User,
    id: number,
  ): Promise<RegistrationRequest> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以查询登记申请');
    }

    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id },
      relations: ['buyer', 'supplier', 'product'],
    });

    if (!registrationRequest) {
      throw new NotFoundException('登记申请不存在');
    }

    // 验证权限
    if (
      registrationRequest.buyerId !== user.companyId &&
      registrationRequest.supplierId !== user.companyId
    ) {
      throw new ForbiddenException('您无权查看此登记申请');
    }

    return registrationRequest;
  }

  /**
   * 取消登记申请（采购商）
   */
  async cancelRegistrationRequest(
    user: User,
    id: number,
  ): Promise<RegistrationRequest> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以操作登记申请');
    }

    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id, buyerId: user.companyId },
    });

    if (!registrationRequest) {
      throw new NotFoundException('登记申请不存在或您无权操作');
    }

    // 验证状态
    if (!this.canCancel(registrationRequest.status)) {
      throw new BadRequestException(
        `当前状态（${registrationRequest.status}）不允许取消`,
      );
    }

    registrationRequest.status = RegistrationRequestStatus.CANCELLED;
    const updated = await this.registrationRequestRepository.save(registrationRequest);

    // 通知供应商
    await this.sendStatusChangeNotification(
      registrationRequest.supplierId,
      registrationRequest.regReqNo,
      '登记申请已取消',
      '采购商已取消登记申请',
      updated.id,
      NotificationType.REGISTRATION_REQUEST_CANCELLED,
    );

    return updated;
  }

  /**
   * 接受登记申请（供应商）
   */
  async acceptRegistrationRequest(
    user: User,
    id: number,
  ): Promise<RegistrationRequest> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以操作登记申请');
    }

    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id, supplierId: user.companyId },
    });

    if (!registrationRequest) {
      throw new NotFoundException('登记申请不存在或您无权操作');
    }

    // 验证状态
    if (registrationRequest.status !== RegistrationRequestStatus.PENDING_RESPONSE) {
      throw new BadRequestException('只有待回复状态的申请可以接受');
    }

    registrationRequest.status = RegistrationRequestStatus.IN_PROGRESS;
    const updated = await this.registrationRequestRepository.save(registrationRequest);

    // 通知采购商
    await this.sendStatusChangeNotification(
      registrationRequest.buyerId,
      registrationRequest.regReqNo,
      '登记申请已接受',
      '供应商已接受您的登记申请',
      updated.id,
      NotificationType.REGISTRATION_REQUEST_ACCEPTED,
    );

    return updated;
  }

  /**
   * 拒绝登记申请（供应商）
   */
  async rejectRegistrationRequest(
    user: User,
    id: number,
    rejectDto: RejectRegistrationRequestDto,
  ): Promise<RegistrationRequest> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以操作登记申请');
    }

    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id, supplierId: user.companyId },
    });

    if (!registrationRequest) {
      throw new NotFoundException('登记申请不存在或您无权操作');
    }

    // 验证状态
    if (registrationRequest.status !== RegistrationRequestStatus.PENDING_RESPONSE) {
      throw new BadRequestException('只有待回复状态的申请可以拒绝');
    }

    registrationRequest.status = RegistrationRequestStatus.DECLINED;
    registrationRequest.details = {
      ...registrationRequest.details,
      rejectReason: rejectDto.rejectReason,
    };
    const updated = await this.registrationRequestRepository.save(registrationRequest);

    // 通知采购商
    await this.sendStatusChangeNotification(
      registrationRequest.buyerId,
      registrationRequest.regReqNo,
      '登记申请已拒绝',
      `供应商已拒绝您的登记申请，原因：${rejectDto.rejectReason}`,
      updated.id,
      NotificationType.REGISTRATION_REQUEST_REJECTED,
    );

    return updated;
  }

  /**
   * 更新进度（供应商）
   */
  async updateProgress(
    user: User,
    id: number,
    updateDto: UpdateRegistrationProgressDto,
  ): Promise<RegistrationRequest> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以操作登记申请');
    }

    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id, supplierId: user.companyId },
    });

    if (!registrationRequest) {
      throw new NotFoundException('登记申请不存在或您无权操作');
    }

    // 验证状态
    if (registrationRequest.status !== RegistrationRequestStatus.IN_PROGRESS) {
      throw new BadRequestException('只有进行中的申请可以更新进度');
    }

    registrationRequest.details = {
      ...registrationRequest.details,
      progressNote: updateDto.progressNote,
      estimatedCompletionDate: updateDto.estimatedCompletionDate,
      lastUpdateTime: new Date().toISOString(),
    };
    const updated = await this.registrationRequestRepository.save(registrationRequest);

    // 通知采购商
    await this.sendStatusChangeNotification(
      registrationRequest.buyerId,
      registrationRequest.regReqNo,
      '登记申请进度更新',
      `供应商更新了登记进度：${updateDto.progressNote}`,
      updated.id,
      NotificationType.REGISTRATION_REQUEST_PROGRESS,
    );

    return updated;
  }

  /**
   * 完成登记申请（供应商）
   */
  async completeRegistrationRequest(
    user: User,
    id: number,
  ): Promise<RegistrationRequest> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以操作登记申请');
    }

    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id, supplierId: user.companyId },
    });

    if (!registrationRequest) {
      throw new NotFoundException('登记申请不存在或您无权操作');
    }

    // 验证状态
    if (registrationRequest.status !== RegistrationRequestStatus.IN_PROGRESS) {
      throw new BadRequestException('只有进行中的申请可以标记为完成');
    }

    registrationRequest.status = RegistrationRequestStatus.COMPLETED;
    const updated = await this.registrationRequestRepository.save(registrationRequest);

    // 通知采购商
    await this.sendStatusChangeNotification(
      registrationRequest.buyerId,
      registrationRequest.regReqNo,
      '登记申请已完成',
      '供应商已完成您的登记申请',
      updated.id,
      NotificationType.REGISTRATION_REQUEST_COMPLETED,
    );

    return updated;
  }

  /**
   * 获取统计信息
   */
  async getStats(user: User, type: 'buyer' | 'supplier'): Promise<any> {
    if (!user.companyId) {
      throw new BadRequestException('只有企业用户可以查询统计信息');
    }

    const condition =
      type === 'buyer'
        ? { buyerId: user.companyId }
        : { supplierId: user.companyId };

    const stats = await this.registrationRequestRepository
      .createQueryBuilder('registrationRequest')
      .select('registrationRequest.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(condition)
      .groupBy('registrationRequest.status')
      .getRawMany();

    const result = {
      pendingResponse: 0,
      inProgress: 0,
      completed: 0,
      declined: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count);
      switch (stat.status) {
        case RegistrationRequestStatus.PENDING_RESPONSE:
          result.pendingResponse = count;
          break;
        case RegistrationRequestStatus.IN_PROGRESS:
          result.inProgress = count;
          break;
        case RegistrationRequestStatus.COMPLETED:
          result.completed = count;
          break;
        case RegistrationRequestStatus.DECLINED:
          result.declined = count;
          break;
        case RegistrationRequestStatus.CANCELLED:
          result.cancelled = count;
          break;
      }
      result.total += count;
    });

    return result;
  }

  /**
   * 创建查询构建器
   */
  private createQueryBuilder(
    queryDto: QueryRegistrationRequestDto,
  ): SelectQueryBuilder<RegistrationRequest> {
    const queryBuilder = this.registrationRequestRepository
      .createQueryBuilder('registrationRequest')
      .leftJoinAndSelect('registrationRequest.buyer', 'buyer')
      .leftJoinAndSelect('registrationRequest.supplier', 'supplier')
      .leftJoinAndSelect('registrationRequest.product', 'product')
      .orderBy('registrationRequest.createdAt', 'DESC');

    const {
      regReqNo,
      status,
      supplierId,
      productId,
      targetCountry,
      createdStartDate,
      createdEndDate,
      keyword,
    } = queryDto;

    if (regReqNo) {
      queryBuilder.andWhere('registrationRequest.regReqNo = :regReqNo', { regReqNo });
    }

    if (status) {
      queryBuilder.andWhere('registrationRequest.status = :status', { status });
    }

    if (supplierId) {
      queryBuilder.andWhere('registrationRequest.supplierId = :supplierId', {
        supplierId,
      });
    }

    if (productId) {
      queryBuilder.andWhere('registrationRequest.productId = :productId', {
        productId,
      });
    }

    if (targetCountry) {
      queryBuilder.andWhere(
        "JSON_EXTRACT(registrationRequest.details, '$.targetCountry') = :targetCountry",
        { targetCountry },
      );
    }

    if (createdStartDate) {
      queryBuilder.andWhere('registrationRequest.createdAt >= :createdStartDate', {
        createdStartDate,
      });
    }

    if (createdEndDate) {
      queryBuilder.andWhere('registrationRequest.createdAt <= :createdEndDate', {
        createdEndDate: createdEndDate + ' 23:59:59',
      });
    }

    if (keyword) {
      queryBuilder.andWhere(
        `(
          registrationRequest.regReqNo LIKE :keyword OR
          JSON_UNQUOTE(JSON_EXTRACT(registrationRequest.productSnapshot, '$.name')) LIKE :keyword OR
          JSON_EXTRACT(registrationRequest.details, '$.targetCountry') LIKE :keyword
        )`,
        { keyword: `%${keyword}%` },
      );
    }

    return queryBuilder;
  }

  /**
   * 发送状态变更通知
   */
  private async sendStatusChangeNotification(
    companyId: number,
    regReqNo: string,
    title: string,
    content: string,
    requestId: number,
    notificationType: NotificationType,
  ): Promise<void> {
    const users = await this.userRepository.find({
      where: { companyId },
    });

    for (const user of users) {
      await this.notificationsService.createNotificationForUser(
        user.id,
        notificationType,
        title,
        `${content}，申请单号：${regReqNo}`,
        {
          relatedId: requestId,
          relatedType: 'registration_request',
          actionUrl: `/registration-requests/${requestId}`,
        },
      );
    }
  }

  /**
   * 检查是否可以取消
   */
  private canCancel(status: RegistrationRequestStatus): boolean {
    return [
      RegistrationRequestStatus.PENDING_RESPONSE,
      RegistrationRequestStatus.IN_PROGRESS,
    ].includes(status);
  }

  /**
   * 生成登记申请单号
   */
  private generateRegistrationRequestNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `REG${dateStr}${timeStr}${random}`;
  }
}