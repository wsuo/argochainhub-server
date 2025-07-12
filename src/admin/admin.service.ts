import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Company,
  CompanyStatus,
  CompanyType,
} from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Inquiry, InquiryStatus } from '../entities/inquiry.entity';
import { SampleRequest, SampleRequestStatus } from '../entities/sample-request.entity';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionType,
} from '../entities/subscription.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { Plan } from '../entities/plan.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ReviewCompanyDto } from './dto/review-company.dto';
import { ReviewProductDto } from './dto/review-product.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import {
  DashboardChartsDto,
  UserGrowthDataDto,
  CompanyRegistrationDataDto,
  RevenueDataDto,
  InquiryTrendDataDto,
  ProductCategoryStatsDto,
} from './dto/dashboard-charts.dto';
import { TranslateRequestDto, LanguageDetectionDto } from './dto/translate.dto';
import { CreateSubscriptionDto } from './dto/subscription-management.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan-management.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company-management.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product-management.dto';
import { 
  InquiryQueryDto, 
  UpdateInquiryStatusDto, 
  InquiryStatsDto 
} from './dto/inquiry-management.dto';
import { 
  SampleRequestQueryDto, 
  UpdateSampleRequestStatusDto, 
  SampleRequestStatsDto 
} from './dto/sample-request-management.dto';
import { VolcTranslateService } from './services/volc-translate.service';
import { SupportedLanguage } from '../common/utils/language-mapper';

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
    @InjectRepository(SampleRequest)
    private readonly sampleRequestRepository: Repository<SampleRequest>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly volcTranslateService: VolcTranslateService,
  ) {}

  // 获取仪表盘图表数据
  async getDashboardCharts(): Promise<DashboardChartsDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 用户增长数据
    const userGrowthData = await this.getUserGrowthData(thirtyDaysAgo, now);

    // 企业注册数据
    const companyRegistrationData = await this.getCompanyRegistrationData(
      thirtyDaysAgo,
      now,
    );

    // 收入数据
    const revenueData = await this.getRevenueData(thirtyDaysAgo, now);

    // 询价趋势数据
    const inquiryTrendData = await this.getInquiryTrendData(thirtyDaysAgo, now);

    // 产品分类统计
    const productCategoryStats = await this.getProductCategoryStats();

    return {
      userGrowth: userGrowthData,
      companyRegistration: companyRegistrationData,
      revenue: revenueData,
      inquiryTrend: inquiryTrendData,
      productCategoryStats: productCategoryStats,
    };
  }

  private async getUserGrowthData(
    startDate: Date,
    endDate: Date,
  ): Promise<UserGrowthDataDto[]> {
    const data = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :startDate', { startDate })
      .andWhere('user.createdAt <= :endDate', { endDate })
      .groupBy('DATE(user.createdAt)')
      .orderBy('DATE(user.createdAt)', 'ASC')
      .getRawMany();

    const result: UserGrowthDataDto[] = [];
    let totalUsers = 0;

    // 获取起始日期之前的用户总数
    const previousUsers = await this.userRepository.count({
      where: { createdAt: LessThan(startDate) },
    });
    totalUsers = previousUsers;

    // 生成连续日期数据
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = data.find((d: any) => d.date === dateStr);
      const newUsers = dayData ? parseInt(dayData.count as string) : 0;
      totalUsers += newUsers;

      result.push({
        date: dateStr,
        newUsers,
        totalUsers,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private async getCompanyRegistrationData(
    startDate: Date,
    endDate: Date,
  ): Promise<CompanyRegistrationDataDto[]> {
    const data = await this.companyRepository
      .createQueryBuilder('company')
      .select('DATE(company.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('company.createdAt >= :startDate', { startDate })
      .andWhere('company.createdAt <= :endDate', { endDate })
      .groupBy('DATE(company.createdAt)')
      .orderBy('DATE(company.createdAt)', 'ASC')
      .getRawMany();

    const result: CompanyRegistrationDataDto[] = [];
    let totalCompanies = 0;

    // 获取起始日期之前的企业总数
    const previousCompanies = await this.companyRepository.count({
      where: { createdAt: LessThan(startDate) },
    });
    totalCompanies = previousCompanies;

    // 生成连续日期数据
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = data.find((d) => d.date === dateStr);
      const newCompanies = dayData ? parseInt(dayData.count) : 0;
      totalCompanies += newCompanies;

      result.push({
        date: dateStr,
        newCompanies,
        totalCompanies,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private async getRevenueData(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueDataDto[]> {
    const data = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.amount)', 'revenue')
      .addSelect('COUNT(*)', 'orderCount')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.status = :status', { status: 'completed' })
      .groupBy('DATE(order.createdAt)')
      .orderBy('DATE(order.createdAt)', 'ASC')
      .getRawMany();

    const result: RevenueDataDto[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = data.find((d) => d.date === dateStr);

      result.push({
        date: dateStr,
        revenue: dayData ? parseFloat(dayData.revenue) || 0 : 0,
        orderCount: dayData ? parseInt(dayData.orderCount) : 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private async getInquiryTrendData(
    startDate: Date,
    endDate: Date,
  ): Promise<InquiryTrendDataDto[]> {
    const inquiryData = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('DATE(inquiry.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('inquiry.createdAt >= :startDate', { startDate })
      .andWhere('inquiry.createdAt <= :endDate', { endDate })
      .groupBy('DATE(inquiry.createdAt)')
      .orderBy('DATE(inquiry.createdAt)', 'ASC')
      .getRawMany();

    const matchedData = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('DATE(inquiry.updatedAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('inquiry.updatedAt >= :startDate', { startDate })
      .andWhere('inquiry.updatedAt <= :endDate', { endDate })
      .andWhere('inquiry.status = :status', { status: InquiryStatus.CONFIRMED })
      .groupBy('DATE(inquiry.updatedAt)')
      .orderBy('DATE(inquiry.updatedAt)', 'ASC')
      .getRawMany();

    const result: InquiryTrendDataDto[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const inquiryDayData = inquiryData.find((d) => d.date === dateStr);
      const matchedDayData = matchedData.find((d) => d.date === dateStr);

      result.push({
        date: dateStr,
        inquiryCount: inquiryDayData ? parseInt(inquiryDayData.count) : 0,
        matchedCount: matchedDayData ? parseInt(matchedDayData.count) : 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private async getProductCategoryStats(): Promise<ProductCategoryStatsDto[]> {
    const data = await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .groupBy('product.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalProducts = data.reduce(
      (sum, item) => sum + parseInt(item.count),
      0,
    );

    return data.map((item) => ({
      category: item.category,
      count: parseInt(item.count),
      percentage:
        totalProducts > 0
          ? Math.round((parseInt(item.count) / totalProducts) * 100 * 100) / 100
          : 0,
    }));
  }

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
      companyTypeStats: companyTypeStats.map((item) => ({
        type: item.type,
        count: parseInt(item.count),
      })),
      inquiryStatusStats: inquiryStatusStats.map((item) => ({
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

  // 获取企业详情
  async getCompanyById(companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['users', 'subscriptions', 'subscriptions.plan'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
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

  // 获取产品详情
  async getProductById(productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['supplier', 'inquiryItems', 'inquiryItems.inquiry'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // 获取用户详情
  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'orders', 'inquiries'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // 翻译文本
  async translateText(translateDto: TranslateRequestDto): Promise<string> {
    return this.volcTranslateService.translateText(translateDto);
  }

  // 检测语言
  async detectLanguage(
    detectionDto: LanguageDetectionDto,
  ): Promise<{ language: SupportedLanguage; confidence: number }> {
    return this.volcTranslateService.detectLanguage(detectionDto);
  }

  // 订阅管理
  async getCompanySubscriptions(
    companyId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Subscription>> {
    const { page = 1, limit = 20 } = paginationDto;

    // 检查企业是否存在
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const [subscriptions, total] =
      await this.subscriptionRepository.findAndCount({
        where: { companyId },
        relations: ['plan', 'order'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

    return {
      data: subscriptions,
      meta: {
        totalItems: total,
        itemCount: subscriptions.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async createSubscriptionForCompany(
    companyId: number,
    createDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    // 检查企业是否存在
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 检查计划是否存在
    const plan = await this.planRepository.findOne({
      where: { id: createDto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // 计算订阅日期
    const startDate = createDto.startDate || new Date();
    const endDate = new Date(
      startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );

    // 创建订阅
    const subscription = this.subscriptionRepository.create({
      companyId,
      planId: createDto.planId,
      startDate,
      endDate,
      type: SubscriptionType.GIFT, // 管理员手动添加的都是赠送类型
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    return this.subscriptionRepository.save(subscription);
  }

  // 订单管理
  async getAllOrders(
    paginationDto: PaginationDto & {
      status?: OrderStatus;
      search?: string;
    },
  ): Promise<PaginatedResult<Order>> {
    const { page = 1, limit = 20, status, search } = paginationDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.company', 'company')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.plan', 'plan');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(order.orderNo LIKE :search OR company.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: orders,
      meta: {
        totalItems: total,
        itemCount: orders.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getOrderById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['company', 'user', 'plan', 'subscriptions'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // 会员计划管理
  async getAllPlans(
    paginationDto: PaginationDto & {
      includeInactive?: boolean;
    },
  ): Promise<PaginatedResult<Plan>> {
    const { page = 1, limit = 20, includeInactive = false } = paginationDto;

    const queryBuilder = this.planRepository.createQueryBuilder('plan');

    if (!includeInactive) {
      queryBuilder.where('plan.isActive = :isActive', { isActive: true });
    }

    const [plans, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('plan.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: plans,
      meta: {
        totalItems: total,
        itemCount: plans.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async createPlan(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create({
      ...createPlanDto,
      isActive: createPlanDto.isActive ?? true,
    });

    return this.planRepository.save(plan);
  }

  async updatePlan(
    planId: number,
    updatePlanDto: UpdatePlanDto,
  ): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async togglePlanStatus(planId: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    plan.isActive = !plan.isActive;
    return this.planRepository.save(plan);
  }

  // 企业CRUD管理
  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  async updateCompany(
    companyId: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  // 产品CRUD管理
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // 检查供应商是否存在
    const supplier = await this.companyRepository.findOne({
      where: { id: createProductDto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier company not found');
    }

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async updateProduct(
    productId: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 如果更新了供应商ID，需要验证供应商是否存在
    if (updateProductDto.supplierId) {
      const supplier = await this.companyRepository.findOne({
        where: { id: updateProductDto.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier company not found');
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  // 询价单业务流程管理
  async getInquiries(
    queryDto: InquiryQueryDto,
  ): Promise<PaginatedResult<Inquiry>> {
    const {
      page = 1,
      limit = 20,
      inquiryNo,
      status,
      buyerId,
      supplierId,
      createdStartDate,
      createdEndDate,
    } = queryDto;

    const queryBuilder = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.buyer', 'buyer')
      .leftJoinAndSelect('inquiry.supplier', 'supplier')
      .leftJoinAndSelect('inquiry.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (inquiryNo) {
      queryBuilder.andWhere('inquiry.inquiryNo LIKE :inquiryNo', {
        inquiryNo: `%${inquiryNo}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    if (buyerId) {
      queryBuilder.andWhere('inquiry.buyerId = :buyerId', { buyerId });
    }

    if (supplierId) {
      queryBuilder.andWhere('inquiry.supplierId = :supplierId', { supplierId });
    }

    if (createdStartDate) {
      queryBuilder.andWhere('DATE(inquiry.createdAt) >= :createdStartDate', {
        createdStartDate,
      });
    }

    if (createdEndDate) {
      queryBuilder.andWhere('DATE(inquiry.createdAt) <= :createdEndDate', {
        createdEndDate,
      });
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

  async getInquiryById(inquiryId: number): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id: inquiryId },
      relations: ['buyer', 'supplier', 'items', 'items.product'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }

  async updateInquiryStatus(
    inquiryId: number,
    updateDto: UpdateInquiryStatusDto,
  ): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id: inquiryId },
      relations: ['buyer', 'supplier', 'items'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // 验证状态转换的合理性
    if (!this.isValidStatusTransition(inquiry.status, updateDto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${inquiry.status} to ${updateDto.status}`,
      );
    }

    // 更新状态
    inquiry.status = updateDto.status;

    // 根据状态更新相关详情
    if (updateDto.status === InquiryStatus.QUOTED && updateDto.quoteDetails) {
      inquiry.quoteDetails = updateDto.quoteDetails;
    }

    if (updateDto.status === InquiryStatus.DECLINED && updateDto.declineReason) {
      inquiry.details = {
        ...inquiry.details,
        declineReason: updateDto.declineReason,
        declinedBy: updateDto.operatedBy,
      };
    }

    return this.inquiryRepository.save(inquiry);
  }

  async getInquiryStats(): Promise<InquiryStatsDto> {
    const stats = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inquiry.status')
      .getRawMany();

    const result: InquiryStatsDto = {
      pendingQuote: 0,
      quoted: 0,
      confirmed: 0,
      declined: 0,
      expired: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count);
      result.total += count;

      switch (stat.status) {
        case InquiryStatus.PENDING_QUOTE:
          result.pendingQuote = count;
          break;
        case InquiryStatus.QUOTED:
          result.quoted = count;
          break;
        case InquiryStatus.CONFIRMED:
          result.confirmed = count;
          break;
        case InquiryStatus.DECLINED:
          result.declined = count;
          break;
        case InquiryStatus.EXPIRED:
          result.expired = count;
          break;
        case InquiryStatus.CANCELLED:
          result.cancelled = count;
          break;
      }
    });

    return result;
  }

  async deleteInquiry(inquiryId: number): Promise<void> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // 只有待报价和已取消状态的询价单可以删除
    if (![InquiryStatus.PENDING_QUOTE, InquiryStatus.CANCELLED].includes(inquiry.status)) {
      throw new BadRequestException(
        'Only pending or cancelled inquiries can be deleted',
      );
    }

    await this.inquiryRepository.remove(inquiry);
  }

  private isValidStatusTransition(
    currentStatus: InquiryStatus,
    newStatus: InquiryStatus,
  ): boolean {
    const validTransitions: Record<InquiryStatus, InquiryStatus[]> = {
      [InquiryStatus.PENDING_QUOTE]: [
        InquiryStatus.QUOTED,
        InquiryStatus.DECLINED,
        InquiryStatus.CANCELLED,
        InquiryStatus.EXPIRED,
      ],
      [InquiryStatus.QUOTED]: [
        InquiryStatus.CONFIRMED,
        InquiryStatus.DECLINED,
        InquiryStatus.EXPIRED,
      ],
      [InquiryStatus.CONFIRMED]: [], // 已确认状态不能再转换
      [InquiryStatus.DECLINED]: [], // 已拒绝状态不能再转换
      [InquiryStatus.EXPIRED]: [], // 已过期状态不能再转换
      [InquiryStatus.CANCELLED]: [], // 已取消状态不能再转换
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // 样品申请业务流程管理
  async getSampleRequests(
    queryDto: SampleRequestQueryDto,
  ): Promise<PaginatedResult<SampleRequest>> {
    const {
      page = 1,
      limit = 20,
      sampleReqNo,
      status,
      buyerId,
      supplierId,
      productId,
      createdStartDate,
      createdEndDate,
    } = queryDto;

    const queryBuilder = this.sampleRequestRepository
      .createQueryBuilder('sampleRequest')
      .leftJoinAndSelect('sampleRequest.buyer', 'buyer')
      .leftJoinAndSelect('sampleRequest.supplier', 'supplier')
      .leftJoinAndSelect('sampleRequest.product', 'product');

    if (sampleReqNo) {
      queryBuilder.andWhere('sampleRequest.sampleReqNo LIKE :sampleReqNo', {
        sampleReqNo: `%${sampleReqNo}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('sampleRequest.status = :status', { status });
    }

    if (buyerId) {
      queryBuilder.andWhere('sampleRequest.buyerId = :buyerId', { buyerId });
    }

    if (supplierId) {
      queryBuilder.andWhere('sampleRequest.supplierId = :supplierId', { supplierId });
    }

    if (productId) {
      queryBuilder.andWhere('sampleRequest.productId = :productId', { productId });
    }

    if (createdStartDate) {
      queryBuilder.andWhere('DATE(sampleRequest.createdAt) >= :createdStartDate', {
        createdStartDate,
      });
    }

    if (createdEndDate) {
      queryBuilder.andWhere('DATE(sampleRequest.createdAt) <= :createdEndDate', {
        createdEndDate,
      });
    }

    const [sampleRequests, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('sampleRequest.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: sampleRequests,
      meta: {
        totalItems: total,
        itemCount: sampleRequests.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getSampleRequestById(sampleRequestId: number): Promise<SampleRequest> {
    const sampleRequest = await this.sampleRequestRepository.findOne({
      where: { id: sampleRequestId },
      relations: ['buyer', 'supplier', 'product'],
    });

    if (!sampleRequest) {
      throw new NotFoundException('Sample request not found');
    }

    return sampleRequest;
  }

  async updateSampleRequestStatus(
    sampleRequestId: number,
    updateDto: UpdateSampleRequestStatusDto,
  ): Promise<SampleRequest> {
    const sampleRequest = await this.sampleRequestRepository.findOne({
      where: { id: sampleRequestId },
      relations: ['buyer', 'supplier', 'product'],
    });

    if (!sampleRequest) {
      throw new NotFoundException('Sample request not found');
    }

    // 验证状态转换的合理性
    if (!this.isValidSampleRequestStatusTransition(sampleRequest.status, updateDto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${sampleRequest.status} to ${updateDto.status}`,
      );
    }

    // 更新状态
    sampleRequest.status = updateDto.status;

    // 根据状态更新相关详情
    if (updateDto.status === SampleRequestStatus.SHIPPED && updateDto.trackingInfo) {
      sampleRequest.trackingInfo = updateDto.trackingInfo;
    }

    if (updateDto.status === SampleRequestStatus.REJECTED && updateDto.rejectReason) {
      // 创建新的details对象，保留现有字段并添加拒绝相关信息
      const updatedDetails = {
        ...sampleRequest.details,
        rejectReason: updateDto.rejectReason,
        rejectedBy: updateDto.operatedBy,
      };
      sampleRequest.details = updatedDetails as any;
    }

    return this.sampleRequestRepository.save(sampleRequest);
  }

  async getSampleRequestStats(): Promise<SampleRequestStatsDto> {
    const stats = await this.sampleRequestRepository
      .createQueryBuilder('sampleRequest')
      .select('sampleRequest.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sampleRequest.status')
      .getRawMany();

    const result: SampleRequestStatsDto = {
      pendingApproval: 0,
      approved: 0,
      shipped: 0,
      delivered: 0,
      rejected: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count);
      result.total += count;

      switch (stat.status) {
        case SampleRequestStatus.PENDING_APPROVAL:
          result.pendingApproval = count;
          break;
        case SampleRequestStatus.APPROVED:
          result.approved = count;
          break;
        case SampleRequestStatus.SHIPPED:
          result.shipped = count;
          break;
        case SampleRequestStatus.DELIVERED:
          result.delivered = count;
          break;
        case SampleRequestStatus.REJECTED:
          result.rejected = count;
          break;
        case SampleRequestStatus.CANCELLED:
          result.cancelled = count;
          break;
      }
    });

    return result;
  }

  async deleteSampleRequest(sampleRequestId: number): Promise<void> {
    const sampleRequest = await this.sampleRequestRepository.findOne({
      where: { id: sampleRequestId },
    });

    if (!sampleRequest) {
      throw new NotFoundException('Sample request not found');
    }

    // 只有待审核和已取消状态的样品申请可以删除
    if (![SampleRequestStatus.PENDING_APPROVAL, SampleRequestStatus.CANCELLED].includes(sampleRequest.status)) {
      throw new BadRequestException(
        'Only pending approval or cancelled sample requests can be deleted',
      );
    }

    await this.sampleRequestRepository.remove(sampleRequest);
  }

  private isValidSampleRequestStatusTransition(
    currentStatus: SampleRequestStatus,
    newStatus: SampleRequestStatus,
  ): boolean {
    const validTransitions: Record<SampleRequestStatus, SampleRequestStatus[]> = {
      [SampleRequestStatus.PENDING_APPROVAL]: [
        SampleRequestStatus.APPROVED,
        SampleRequestStatus.REJECTED,
        SampleRequestStatus.CANCELLED,
      ],
      [SampleRequestStatus.APPROVED]: [
        SampleRequestStatus.SHIPPED,
        SampleRequestStatus.CANCELLED,
      ],
      [SampleRequestStatus.SHIPPED]: [
        SampleRequestStatus.DELIVERED,
      ],
      [SampleRequestStatus.DELIVERED]: [], // 已送达状态不能再转换
      [SampleRequestStatus.REJECTED]: [], // 已拒绝状态不能再转换
      [SampleRequestStatus.CANCELLED]: [], // 已取消状态不能再转换
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
