import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry, InquiryStatus } from '../entities/inquiry.entity';
import { InquiryItem } from '../entities/inquiry-item.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import {
  Company,
  CompanyType,
  CompanyStatus,
} from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Communication, RelatedService } from '../entities/communication.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QuoteInquiryDto } from './dto/quote-inquiry.dto';
import { SearchInquiriesDto } from './dto/search-inquiries.dto';
import { DeclineInquiryDto } from './dto/decline-inquiry.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SupplierQuoteSearchDto, QuoteStatsDto, BatchUpdateQuoteDto } from './dto/supplier-quote-management.dto';
import { BuyerInquiryStatsDto } from './dto/buyer-inquiry-stats.dto';
import { AuthForbiddenException } from '../common/exceptions/auth-forbidden.exception';
import { AuthErrorCode } from '../common/constants/error-codes';
import { InquiryMessageService } from './inquiry-message.service';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(InquiryItem)
    private readonly inquiryItemRepository: Repository<InquiryItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Communication)
    private readonly communicationRepository: Repository<Communication>,
    private readonly inquiryMessageService: InquiryMessageService,
  ) {}

  async createInquiry(
    user: User,
    createInquiryDto: CreateInquiryDto,
  ): Promise<Inquiry> {
    // 验证企业类型
    if (!user.company || user.company.type !== CompanyType.BUYER) {
      throw new ForbiddenException('Only buyers can create inquiries');
    }

    const { supplierId, items, details, deadline } = createInquiryDto;

    // 验证供应商
    const supplier = await this.companyRepository.findOne({
      where: {
        id: supplierId,
        type: CompanyType.SUPPLIER,
        status: CompanyStatus.ACTIVE,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found or inactive');
    }

    // 验证产品并创建快照
    const productIds = items.map((item) => item.productId);
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.id IN (:...productIds)', { productIds })
      .andWhere('product.supplierId = :supplierId', { supplierId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .getMany();

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Some products not found or not from this supplier',
      );
    }

    // 生成询价单号
    const inquiryNo = this.generateInquiryNumber();

    // 创建询价单
    const inquiry = this.inquiryRepository.create({
      inquiryNo,
      buyerId: user.companyId,
      supplierId,
      status: InquiryStatus.PENDING_QUOTE,
      details,
      deadline: new Date(deadline),
    });

    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 创建询价项目
    const inquiryItems: InquiryItem[] = [];
    
    try {
      for (const itemDto of items) {
        // 修复：使用Number()确保产品ID类型匹配
        const product = products.find((p) => Number(p.id) === Number(itemDto.productId));
        
        if (product) {
          const inquiryItem = this.inquiryItemRepository.create({
            inquiryId: savedInquiry.id,
            productId: product.id,
            quantity: itemDto.quantity,
            unit: itemDto.unit,
            packagingReq: itemDto.packagingReq || undefined,
            productSnapshot: {
              name: product.name,
              pesticideName: product.pesticideName,
              formulation: product.formulation,
              activeIngredient1: product.activeIngredient1,
              activeIngredient2: product.activeIngredient2,
              activeIngredient3: product.activeIngredient3,
              totalContent: product.totalContent,
            },
          });
          
          const savedItem = await this.inquiryItemRepository.save(inquiryItem);
          inquiryItems.push(savedItem);
        }
      }
    } catch (error) {
      console.error('创建询价项目时出错:', error);
      throw error;
    }

    return this.getInquiryDetail(user, savedInquiry.id);
  }

  async getMyInquiries(
    user: User,
    searchDto: SearchInquiriesDto,
  ): Promise<PaginatedResult<Inquiry>> {
    const { status, page = 1, limit = 20 } = searchDto;

    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.buyer', 'buyer')
      .leftJoinAndSelect('inquiry.supplier', 'supplier')
      .leftJoinAndSelect('inquiry.items', 'items');

    // 根据用户企业类型确定查询条件
    if (!user.company) {
      throw new AuthForbiddenException(AuthErrorCode.COMPANY_NOT_ASSOCIATED);
    }

    if (user.company.status !== CompanyStatus.ACTIVE) {
      throw new AuthForbiddenException(AuthErrorCode.COMPANY_NOT_ACTIVE);
    }

    if (user.company.type === CompanyType.BUYER) {
      queryBuilder.where('inquiry.buyerId = :companyId', {
        companyId: user.companyId,
      });
    } else if (user.company.type === CompanyType.SUPPLIER) {
      queryBuilder.where('inquiry.supplierId = :companyId', {
        companyId: user.companyId,
      });
    } else {
      throw new AuthForbiddenException(AuthErrorCode.INVALID_COMPANY_TYPE);
    }

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    const [inquiries, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('inquiry.createdAt', 'DESC')
      .getManyAndCount();

    // 为每个询价单添加最近消息
    const inquiriesWithMessages = await Promise.all(
      inquiries.map(async (inquiry) => {
        const recentMessages = await this.communicationRepository
          .createQueryBuilder('communication')
          .leftJoinAndSelect('communication.sender', 'sender')
          .leftJoinAndSelect('sender.company', 'company')
          .where('communication.relatedService = :service', {
            service: RelatedService.INQUIRY,
          })
          .andWhere('communication.relatedId = :inquiryId', { inquiryId: inquiry.id })
          .orderBy('communication.createdAt', 'DESC')
          .limit(5)
          .getMany();

        return {
          ...inquiry,
          recentMessages,
        };
      })
    );

    return {
      data: inquiriesWithMessages,
      meta: {
        totalItems: total,
        itemCount: inquiries.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getInquiryDetail(user: User, id: number): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['buyer', 'supplier', 'items', 'items.product'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // 验证访问权限
    if (
      inquiry.buyerId !== user.companyId &&
      inquiry.supplierId !== user.companyId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this inquiry',
      );
    }

    return inquiry;
  }

  async getInquiryDetailWithMessages(user: User, id: number) {
    const inquiry = await this.getInquiryDetail(user, id);
    
    // 获取最近的消息记录
    const recentMessages = await this.communicationRepository
      .createQueryBuilder('communication')
      .leftJoinAndSelect('communication.sender', 'sender')
      .leftJoinAndSelect('sender.company', 'company')
      .where('communication.relatedService = :service', {
        service: RelatedService.INQUIRY,
      })
      .andWhere('communication.relatedId = :inquiryId', { inquiryId: id })
      .orderBy('communication.createdAt', 'DESC')
      .limit(5) // 只返回最近5条消息
      .getMany();

    return {
      ...inquiry,
      recentMessages,
    };
  }

  async quoteInquiry(
    user: User,
    id: number,
    quoteDto: QuoteInquiryDto,
  ): Promise<Inquiry> {
    const inquiry = await this.getInquiryDetail(user, id);

    // 验证权限：只有供应商能报价
    if (inquiry.supplierId !== user.companyId) {
      throw new ForbiddenException('Only the supplier can quote this inquiry');
    }

    // 验证状态：只有待报价状态可以报价
    if (inquiry.status !== InquiryStatus.PENDING_QUOTE) {
      throw new BadRequestException(
        `Cannot quote inquiry with status '${inquiry.status}'`,
      );
    }

    // 检查截止日期
    if (new Date() > inquiry.deadline) {
      throw new BadRequestException('Quote deadline has passed');
    }

    // 保存旧状态
    const oldStatus = inquiry.status;

    // 更新询价单
    inquiry.quoteDetails = quoteDto.quoteDetails;
    inquiry.status = InquiryStatus.QUOTED;

    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 推送状态更新
    await this.inquiryMessageService.pushInquiryStatusUpdate(
      savedInquiry,
      oldStatus,
      user,
    );

    return savedInquiry;
  }

  async confirmInquiry(user: User, id: number): Promise<Inquiry> {
    const inquiry = await this.getInquiryDetail(user, id);

    // 验证权限：只有采购商能确认
    if (inquiry.buyerId !== user.companyId) {
      throw new ForbiddenException('Only the buyer can confirm this inquiry');
    }

    // 验证状态：只有已报价状态可以确认
    if (inquiry.status !== InquiryStatus.QUOTED) {
      throw new BadRequestException(
        `Cannot confirm inquiry with status '${inquiry.status}'`,
      );
    }

    // 保存旧状态
    const oldStatus = inquiry.status;

    inquiry.status = InquiryStatus.CONFIRMED;
    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 推送状态更新
    await this.inquiryMessageService.pushInquiryStatusUpdate(
      savedInquiry,
      oldStatus,
      user,
    );

    return savedInquiry;
  }

  async declineInquiry(
    user: User,
    id: number,
    declineDto: DeclineInquiryDto,
  ): Promise<Inquiry> {
    const inquiry = await this.getInquiryDetail(user, id);

    // 验证权限
    const canDecline =
      inquiry.buyerId === user.companyId ||
      inquiry.supplierId === user.companyId;
    if (!canDecline) {
      throw new ForbiddenException(
        'You do not have permission to decline this inquiry',
      );
    }

    // 验证状态
    const validStatuses = [InquiryStatus.PENDING_QUOTE, InquiryStatus.QUOTED];
    if (!validStatuses.includes(inquiry.status)) {
      throw new BadRequestException(
        `Cannot decline inquiry with status '${inquiry.status}'`,
      );
    }

    // 保存旧状态
    const oldStatus = inquiry.status;

    // 记录拒绝原因到details中
    inquiry.details = {
      ...inquiry.details,
      declineReason: declineDto.reason,
      declinedBy: user.companyId === inquiry.buyerId ? 'buyer' : 'supplier',
    };
    inquiry.status = InquiryStatus.DECLINED;

    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 推送状态更新
    await this.inquiryMessageService.pushInquiryStatusUpdate(
      savedInquiry,
      oldStatus,
      user,
    );

    return savedInquiry;
  }

  async cancelInquiry(user: User, id: number): Promise<Inquiry> {
    const inquiry = await this.getInquiryDetail(user, id);

    // 验证权限：只有采购商能取消
    if (inquiry.buyerId !== user.companyId) {
      throw new ForbiddenException('Only the buyer can cancel this inquiry');
    }

    // 验证状态：只有待报价状态可以取消
    if (inquiry.status !== InquiryStatus.PENDING_QUOTE) {
      throw new BadRequestException(
        `Cannot cancel inquiry with status '${inquiry.status}'`,
      );
    }

    // 保存旧状态
    const oldStatus = inquiry.status;

    inquiry.status = InquiryStatus.CANCELLED;
    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 推送状态更新
    await this.inquiryMessageService.pushInquiryStatusUpdate(
      savedInquiry,
      oldStatus,
      user,
    );

    return savedInquiry;
  }

  private generateInquiryNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `INQ${timestamp}${random}`;
  }

  async sendMessage(
    user: User,
    inquiryId: number,
    sendMessageDto: SendMessageDto,
  ): Promise<Communication> {
    // 验证询价单存在且用户有权限
    const inquiry = await this.getInquiryDetail(user, inquiryId);

    // 创建消息
    const communication = this.communicationRepository.create({
      relatedService: RelatedService.INQUIRY,
      relatedId: inquiryId,
      message: sendMessageDto.message,
      senderId: user.id,
    });

    const savedCommunication = await this.communicationRepository.save(communication);

    // 查询完整的消息信息（包含发送者信息）
    const fullCommunication = await this.communicationRepository.findOne({
      where: { id: savedCommunication.id },
      relations: ['sender', 'sender.company'],
    });

    if (fullCommunication) {
      // 推送消息给相关企业
      await this.inquiryMessageService.pushInquiryMessage(
        fullCommunication,
        inquiry,
        user,
      );
    }

    return savedCommunication;
  }

  async getMessages(
    user: User,
    inquiryId: number,
    getMessagesDto: GetMessagesDto,
  ): Promise<PaginatedResult<Communication>> {
    // 验证询价单存在且用户有权限
    await this.getInquiryDetail(user, inquiryId);

    const { page = 1, limit = 20, desc = true } = getMessagesDto;

    const queryBuilder = this.communicationRepository
      .createQueryBuilder('communication')
      .leftJoinAndSelect('communication.sender', 'sender')
      .leftJoinAndSelect('sender.company', 'company')
      .where('communication.relatedService = :service', {
        service: RelatedService.INQUIRY,
      })
      .andWhere('communication.relatedId = :inquiryId', { inquiryId });

    const orderDirection = desc ? 'DESC' : 'ASC';
    queryBuilder.orderBy('communication.createdAt', orderDirection);

    const [messages, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: messages,
      meta: {
        totalItems: total,
        itemCount: messages.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  // 供应端报价管理方法
  async getSupplierQuotes(
    user: User,
    searchDto: SupplierQuoteSearchDto,
  ): Promise<PaginatedResult<Inquiry>> {
    // 验证用户是供应商
    if (!user.company || user.company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only suppliers can access quote management');
    }

    const { page = 1, limit = 10, status, startDate, endDate, keyword } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.buyer', 'buyer')
      .leftJoinAndSelect('inquiry.supplier', 'supplier')
      .leftJoinAndSelect('inquiry.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('inquiry.supplierId = :supplierId', {
        supplierId: user.companyId,
      });

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    // 日期范围筛选
    if (startDate) {
      queryBuilder.andWhere('inquiry.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('inquiry.createdAt <= :endDate', { endDate });
    }

    // 关键词模糊搜索：支持询价单号、采购商公司名称、产品名称、买方备注等
    if (keyword) {
      queryBuilder.andWhere(
        `(
          inquiry.inquiryNo LIKE :keyword 
          OR JSON_EXTRACT(buyer.name, '$.\"zh-CN\"') LIKE :keyword 
          OR JSON_EXTRACT(buyer.name, '$.\"en\"') LIKE :keyword
          OR JSON_EXTRACT(inquiry.details, '$.\"buyerRemarks\"') LIKE :keyword
          OR EXISTS (
            SELECT 1 FROM inquiry_items ii 
            WHERE ii.inquiryId = inquiry.id 
            AND (
              JSON_EXTRACT(ii.productSnapshot, '$.\"name\".\"zh-CN\"') LIKE :keyword
              OR JSON_EXTRACT(ii.productSnapshot, '$.\"name\".\"en\"') LIKE :keyword
              OR JSON_EXTRACT(ii.productSnapshot, '$.\"pesticideName\".\"zh-CN\"') LIKE :keyword
              OR JSON_EXTRACT(ii.productSnapshot, '$.\"pesticideName\".\"en\"') LIKE :keyword
            )
          )
        )`,
        { keyword: `%${keyword}%` }
      );
    }

    // 排序：优先显示待报价和报价截止时间临近的
    queryBuilder
      .addOrderBy('inquiry.deadline', 'ASC')
      .addOrderBy('inquiry.createdAt', 'DESC');

    const [inquiries, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 为每个询价单添加最近消息
    const inquiriesWithMessages = await Promise.all(
      inquiries.map(async (inquiry) => {
        const recentMessages = await this.communicationRepository
          .createQueryBuilder('communication')
          .leftJoinAndSelect('communication.sender', 'sender')
          .leftJoinAndSelect('sender.company', 'company')
          .where('communication.relatedService = :service', {
            service: RelatedService.INQUIRY,
          })
          .andWhere('communication.relatedId = :inquiryId', { inquiryId: inquiry.id })
          .orderBy('communication.createdAt', 'DESC')
          .limit(5)
          .getMany();

        return {
          ...inquiry,
          recentMessages,
        };
      })
    );

    return {
      data: inquiriesWithMessages,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemCount: inquiries.length,
      },
    };
  }

  async getSupplierQuoteStats(user: User): Promise<QuoteStatsDto> {
    // 验证用户是供应商
    if (!user.company || user.company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only suppliers can access quote stats');
    }

    const supplierId = user.companyId;

    // 获取各状态统计
    const stats = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('inquiry.supplierId = :supplierId', { supplierId })
      .groupBy('inquiry.status')
      .getRawMany();

    // 获取本月报价数量
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyQuoteCount = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .where('inquiry.supplierId = :supplierId', { supplierId })
      .andWhere('inquiry.status = :status', { status: InquiryStatus.QUOTED })
      .andWhere('inquiry.updatedAt >= :currentMonth', { currentMonth })
      .getCount();

    // 统计数据整理
    const statusMap = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    const pendingQuoteCount = statusMap[InquiryStatus.PENDING_QUOTE] || 0;
    const quotedCount = statusMap[InquiryStatus.QUOTED] || 0;
    const confirmedCount = statusMap[InquiryStatus.CONFIRMED] || 0;
    const declinedCount = statusMap[InquiryStatus.DECLINED] || 0;
    const totalCount = Object.values(statusMap).reduce((sum: number, count: number) => sum + count, 0) as number;

    // 计算成功率（确认数 / (确认数 + 拒绝数)）
    const successRate = (confirmedCount + declinedCount) > 0 
      ? ((confirmedCount / (confirmedCount + declinedCount)) * 100).toFixed(1) + '%'
      : '0%';

    return {
      pendingQuoteCount,
      quotedCount,
      confirmedCount,
      declinedCount,
      totalCount,
      monthlyQuoteCount,
      successRate,
    };
  }

  async getBuyerInquiryStats(user: User): Promise<BuyerInquiryStatsDto> {
    // 验证用户是采购商
    if (!user.company || user.company.type !== CompanyType.BUYER) {
      throw new ForbiddenException('Only buyers can access inquiry stats');
    }

    const buyerId = user.companyId;

    // 获取各状态统计
    const stats = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('inquiry.buyerId = :buyerId', { buyerId })
      .groupBy('inquiry.status')
      .getRawMany();

    const statusMap = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    const pendingQuoteCount = statusMap[InquiryStatus.PENDING_QUOTE] || 0;
    const quotedCount = statusMap[InquiryStatus.QUOTED] || 0;
    const confirmedCount = statusMap[InquiryStatus.CONFIRMED] || 0;
    const declinedCount = statusMap[InquiryStatus.DECLINED] || 0;
    const cancelledCount = statusMap[InquiryStatus.CANCELLED] || 0;
    const totalCount = Object.values(statusMap).reduce((sum: number, count: number) => sum + count, 0) as number;

    return {
      pendingQuoteCount,
      quotedCount,
      confirmedCount,
      declinedCount,
      cancelledCount,
      totalCount,
    };
  }

  async batchUpdateQuotes(
    user: User,
    batchUpdateDto: BatchUpdateQuoteDto,
  ): Promise<{ successCount: number; failCount: number; errors: string[] }> {
    // 验证用户是供应商
    if (!user.company || user.company.type !== CompanyType.SUPPLIER) {
      throw new ForbiddenException('Only suppliers can batch update quotes');
    }

    const { inquiryIds, action, reason, priority } = batchUpdateDto;
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const inquiryId of inquiryIds) {
      try {
        // 获取询价单
        const inquiry = await this.inquiryRepository.findOne({
          where: { id: inquiryId, supplierId: user.companyId },
        });

        if (!inquiry) {
          errors.push(`询价单 ${inquiryId} 不存在或无访问权限`);
          failCount++;
          continue;
        }

        if (action === 'decline') {
          // 批量拒绝
          if (![InquiryStatus.PENDING_QUOTE, InquiryStatus.QUOTED].includes(inquiry.status)) {
            errors.push(`询价单 ${inquiryId} 状态不允许拒绝`);
            failCount++;
            continue;
          }

          inquiry.details = {
            ...inquiry.details,
            declineReason: reason || '批量拒绝',
            declinedBy: 'supplier',
          };
          inquiry.status = InquiryStatus.DECLINED;

        } else if (action === 'update_priority') {
          // 批量更新优先级
          inquiry.details = {
            ...inquiry.details,
            supplierPriority: priority || 'normal',
          };
        }

        await this.inquiryRepository.save(inquiry);
        successCount++;

      } catch (error) {
        errors.push(`询价单 ${inquiryId} 处理失败: ${error.message}`);
        failCount++;
      }
    }

    return { successCount, failCount, errors };
  }

  async getQuoteHistory(user: User, inquiryId: number): Promise<any> {
    // 验证用户是供应商并有权限访问该询价单
    const inquiry = await this.inquiryRepository.findOne({
      where: { id: inquiryId, supplierId: user.companyId },
      relations: ['buyer', 'supplier'],
    });

    if (!inquiry) {
      throw new NotFoundException('询价单不存在或无访问权限');
    }

    // 获取历史记录（从communications表）
    const history = await this.communicationRepository.find({
      where: {
        relatedService: RelatedService.INQUIRY,
        relatedId: inquiryId,
      },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    return {
      inquiry,
      history,
    };
  }
}
