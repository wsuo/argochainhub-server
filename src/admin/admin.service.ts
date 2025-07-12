import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus, CompanyType } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Inquiry, InquiryStatus } from '../entities/inquiry.entity';
import { Subscription } from '../entities/subscription.entity';
import { Order } from '../entities/order.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ReviewCompanyDto } from './dto/review-company.dto';
import { ReviewProductDto } from './dto/review-product.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // 获取管理统计数据
  async getStats(): Promise<AdminStatsDto> {
    const [
      totalCompanies,
      pendingCompanies,
      totalUsers,
      totalProducts,
      pendingProducts,
      totalInquiries,
      totalOrders,
    ] = await Promise.all([
      this.companyRepository.count(),
      this.companyRepository.count({
        where: { status: CompanyStatus.PENDING_REVIEW },
      }),
      this.userRepository.count(),
      this.productRepository.count(),
      this.productRepository.count({
        where: { status: ProductStatus.PENDING_REVIEW },
      }),
      this.inquiryRepository.count(),
      this.orderRepository.count(),
    ]);

    // 获取企业类型分布
    const companyTypeStats = await this.companyRepository
      .createQueryBuilder('company')
      .select('company.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('company.type')
      .getRawMany();

    // 获取询价状态分布
    const inquiryStatusStats = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inquiry.status')
      .getRawMany();

    return {
      totalCompanies,
      pendingCompanies,
      totalUsers,
      totalProducts,
      pendingProducts,
      totalInquiries,
      totalOrders,
      companyTypeStats: companyTypeStats.map(item => ({
        type: item.type,
        count: parseInt(item.count),
      })),
      inquiryStatusStats: inquiryStatusStats.map(item => ({
        status: item.status,
        count: parseInt(item.count),
      })),
    };
  }

  // 获取待审核企业列表
  async getPendingCompanies(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Company>> {
    const { page = 1, limit = 20 } = paginationDto;

    const [companies, total] = await this.companyRepository.findAndCount({
      where: { status: CompanyStatus.PENDING_REVIEW },
      relations: ['users'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: companies,
      meta: {
        totalItems: total,
        itemCount: companies.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  // 审核企业
  async reviewCompany(
    companyId: number,
    reviewDto: ReviewCompanyDto,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.PENDING_REVIEW) {
      throw new BadRequestException('Company is not pending review');
    }

    const { approved, reason } = reviewDto;

    company.status = approved ? CompanyStatus.ACTIVE : CompanyStatus.DISABLED;
    // 审核信息可以记录在单独的字段或日志中，这里简化处理

    return this.companyRepository.save(company);
  }

  // 获取所有企业列表
  async getAllCompanies(
    paginationDto: PaginationDto & { 
      status?: CompanyStatus; 
      type?: CompanyType; 
      search?: string;
    },
  ): Promise<PaginatedResult<Company>> {
    const { page = 1, limit = 20, status, type, search } = paginationDto;

    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.users', 'users');

    if (status) {
      queryBuilder.andWhere('company.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('company.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(company.name LIKE :search OR company.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [companies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('company.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: companies,
      meta: {
        totalItems: total,
        itemCount: companies.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  // 获取待审核产品列表
  async getPendingProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 20 } = paginationDto;

    const [products, total] = await this.productRepository.findAndCount({
      where: { status: ProductStatus.PENDING_REVIEW },
      relations: ['supplier'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: products,
      meta: {
        totalItems: total,
        itemCount: products.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  // 审核产品
  async reviewProduct(
    productId: number,
    reviewDto: ReviewProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new BadRequestException('Product is not pending review');
    }

    const { approved, reason } = reviewDto;

    product.status = approved ? ProductStatus.ACTIVE : ProductStatus.REJECTED;
    if (!approved && reason) {
      product.rejectionReason = reason;
    }

    return this.productRepository.save(product);
  }

  // 获取所有产品列表
  async getAllProducts(
    paginationDto: PaginationDto & {
      status?: ProductStatus;
      category?: string;
      search?: string;
    },
  ): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 20, status, category, search } = paginationDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier');

    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.activeIngredient LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: products,
      meta: {
        totalItems: total,
        itemCount: products.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  // 获取所有用户列表
  async getAllUsers(
    paginationDto: PaginationDto & { search?: string },
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20, search } = paginationDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company');

    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: users,
      meta: {
        totalItems: total,
        itemCount: users.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  // 禁用/启用企业
  async toggleCompanyStatus(companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 在激活和禁用之间切换
    if (company.status === CompanyStatus.ACTIVE) {
      company.status = CompanyStatus.DISABLED;
    } else if (company.status === CompanyStatus.DISABLED) {
      company.status = CompanyStatus.ACTIVE;
    } else {
      throw new BadRequestException('Cannot toggle status for this company');
    }

    return this.companyRepository.save(company);
  }

  // 禁用/启用产品
  async toggleProductStatus(productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 在激活和归档之间切换
    if (product.status === ProductStatus.ACTIVE) {
      product.status = ProductStatus.ARCHIVED;
    } else if (product.status === ProductStatus.ARCHIVED) {
      product.status = ProductStatus.ACTIVE;
    } else {
      throw new BadRequestException('Cannot toggle status for this product');
    }

    return this.productRepository.save(product);
  }
}