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
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QuoteInquiryDto } from './dto/quote-inquiry.dto';
import { SearchInquiriesDto } from './dto/search-inquiries.dto';
import { DeclineInquiryDto } from './dto/decline-inquiry.dto';

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
  ) {}

  async createInquiry(
    user: User,
    createInquiryDto: CreateInquiryDto,
  ): Promise<Inquiry> {
    // 验证企业类型
    if (user.company.type !== CompanyType.BUYER) {
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
    for (const itemDto of items) {
      const product = products.find((p) => p.id === itemDto.productId);
      if (product) {
        const inquiryItem = this.inquiryItemRepository.create({
          inquiryId: savedInquiry.id,
          productId: product.id,
          quantity: itemDto.quantity,
          unit: itemDto.unit,
          packagingReq: itemDto.packagingReq,
          productSnapshot: {
            name: product.name,
            category: product.category,
            formulation: product.formulation,
            activeIngredient: product.activeIngredient,
            content: product.content,
          },
        });
        await this.inquiryItemRepository.save(inquiryItem);
      }
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
    if (user.company.type === CompanyType.BUYER) {
      queryBuilder.where('inquiry.buyerId = :companyId', {
        companyId: user.companyId,
      });
    } else if (user.company.type === CompanyType.SUPPLIER) {
      queryBuilder.where('inquiry.supplierId = :companyId', {
        companyId: user.companyId,
      });
    } else {
      throw new ForbiddenException('Invalid company type for inquiry access');
    }

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    const [inquiries, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('inquiry.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: inquiries,
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

    // 更新询价单
    inquiry.quoteDetails = quoteDto.quoteDetails;
    inquiry.status = InquiryStatus.QUOTED;

    return this.inquiryRepository.save(inquiry);
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

    inquiry.status = InquiryStatus.CONFIRMED;
    return this.inquiryRepository.save(inquiry);
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

    // 记录拒绝原因到details中
    inquiry.details = {
      ...inquiry.details,
      declineReason: declineDto.reason,
      declinedBy: user.companyId === inquiry.buyerId ? 'buyer' : 'supplier',
    };
    inquiry.status = InquiryStatus.DECLINED;

    return this.inquiryRepository.save(inquiry);
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

    inquiry.status = InquiryStatus.CANCELLED;
    return this.inquiryRepository.save(inquiry);
  }

  private generateInquiryNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `INQ${timestamp}${random}`;
  }
}
