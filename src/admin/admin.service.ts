import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Brackets } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  Company,
  CompanyStatus,
  CompanyType,
} from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Inquiry, InquiryStatus } from '../entities/inquiry.entity';
import { SampleRequest, SampleRequestStatus } from '../entities/sample-request.entity';
import { RegistrationRequest, RegistrationRequestStatus } from '../entities/registration-request.entity';
import { AdminUser } from '../entities/admin-user.entity';
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
import { AdminCreateProductDto, AdminUpdateProductDto } from './dto/product-management.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UserQueryDto } from './dto/user-query.dto';
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
import { 
  RegistrationRequestQueryDto, 
  UpdateRegistrationRequestStatusDto, 
  RegistrationRequestStatsDto 
} from './dto/registration-request-management.dto';
import { 
  AdminUserQueryDto, 
  CreateAdminUserDto, 
  UpdateAdminUserDto, 
  AdminChangePasswordDto, 
  ResetPasswordDto, 
  AdminUserStatsDto,
  PermissionGroupDto,
  PermissionItemDto,
  AssignPermissionsDto,
  RoleTemplateDto,
  AdminUserPermissionDto
} from './dto/admin-user-management.dto';
import { VolcTranslateService } from './services/volc-translate.service';
import { SupportedLanguage } from '../types/multilang';
import { MultiLangQueryUtil } from '../utils/multilang-query.util';
import { AdminPermission, DEFAULT_ROLE_PERMISSIONS, PermissionHelper } from '../types/permissions';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';
import { MultiLangText } from '../types/multilang';

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
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly volcTranslateService: VolcTranslateService,
    private readonly notificationsService: NotificationsService,
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  // 辅助方法：从MultiLangText中提取字符串
  private extractTextFromMultiLang(text: MultiLangText | string | null | undefined): string {
    if (!text) return '';
    if (typeof text === 'string') return text;
    
    // 尝试获取中文，如果没有则获取英文，最后获取任何可用的语言
    return text['zh-CN'] || text['en'] || text['es'] || Object.values(text)[0] || '';
  }

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
      .select('JSON_UNQUOTE(JSON_EXTRACT(product.details, \'$.productCategory\'))', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('JSON_EXTRACT(product.details, \'$.productCategory\') IS NOT NULL')
      .groupBy('JSON_UNQUOTE(JSON_EXTRACT(product.details, \'$.productCategory\'))')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalProducts = data.reduce(
      (sum, item) => sum + parseInt(item.count),
      0,
    );

    return data.map((item) => ({
      category: item.category || 'unknown',
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
    queryDto: CompanyQueryDto,
  ): Promise<PaginatedResult<Company>> {
    const { 
      page = 1, 
      limit = 20, 
      search,
      country,
      businessCategories, // 主字段，对应数据库
      businessTypes, // 前端兼容字段 
      businessCategory, // 前端兼容字段
      companySize, // 主字段，对应数据库
      size, // 前端兼容字段
      type,
      isTop100,
      createdStartDate,
      createdEndDate,
      minRating,
      maxRating,
      hasEmail,
      hasWebsite,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = queryDto;

    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.users', 'users')
      .where('company.status = :status', { status: CompanyStatus.PENDING_REVIEW });

    // 附加筛选条件
    if (type) {
      queryBuilder.andWhere('company.type = :type', { type });
    }

    if (country) {
      queryBuilder.andWhere('company.country = :country', { country });
    }

    // 业务类别查询 - 优先使用主字段
    const finalBusinessCategories = businessCategories || businessTypes;
    if (finalBusinessCategories && finalBusinessCategories.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(company.businessCategories, :businessCategories)', { 
        businessCategories: JSON.stringify(finalBusinessCategories) 
      });
    }

    // 前端兼容字段：单个businessCategory转换为数组查询
    if (businessCategory && !finalBusinessCategories) {
      queryBuilder.andWhere('JSON_CONTAINS(company.businessCategories, :businessCategory)', { 
        businessCategory: JSON.stringify(businessCategory) 
      });
    }

    // 企业规模查询 - 优先使用主字段
    const finalCompanySize = companySize || size;
    if (finalCompanySize) {
      queryBuilder.andWhere('company.companySize = :companySize', { companySize: finalCompanySize });
    }

    if (isTop100 !== undefined) {
      queryBuilder.andWhere('company.isTop100 = :isTop100', { isTop100 });
    }

    if (createdStartDate && createdEndDate) {
      queryBuilder.andWhere('company.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(createdStartDate),
        endDate: new Date(createdEndDate + ' 23:59:59'),
      });
    }

    if (minRating !== undefined) {
      queryBuilder.andWhere('company.rating >= :minRating', { minRating });
    }

    if (maxRating !== undefined) {
      queryBuilder.andWhere('company.rating <= :maxRating', { maxRating });
    }

    if (hasEmail !== undefined) {
      if (hasEmail) {
        queryBuilder.andWhere('company.email IS NOT NULL AND company.email != ""');
      } else {
        queryBuilder.andWhere('(company.email IS NULL OR company.email = "")');
      }
    }

    if (hasWebsite !== undefined) {
      if (hasWebsite) {
        queryBuilder.andWhere('JSON_UNQUOTE(JSON_EXTRACT(company.profile, "$.website")) IS NOT NULL');
      } else {
        queryBuilder.andWhere('JSON_UNQUOTE(JSON_EXTRACT(company.profile, "$.website")) IS NULL');
      }
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // 搜索企业名称（多语言）
          qb.andWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(company.name, '$."zh-CN"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.name, '$."en"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.name, '$."es"')) LIKE :nameSearch)`,
            { nameSearch: `%${search}%` },
          );
          // 搜索企业描述
          qb.orWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(company.profile, '$."description"."zh-CN"')) LIKE :descSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.profile, '$."description"."en"')) LIKE :descSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.profile, '$."description"."es"')) LIKE :descSearch)`,
            { descSearch: `%${search}%` },
          );
          // 搜索用户邮箱
          qb.orWhere('users.email LIKE :emailSearch', { emailSearch: `%${search}%` });
          // 搜索企业邮箱
          qb.orWhere('company.email LIKE :companyEmailSearch', { companyEmailSearch: `%${search}%` });
        }),
      );
    }

    // 排序
    const sortField = sortBy === 'name' ? 'JSON_UNQUOTE(JSON_EXTRACT(company.name, \'$."zh-CN"\'))' : `company.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    const [companies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
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

  // 审核企业
  async reviewCompany(
    companyId: number,
    reviewDto: ReviewCompanyDto,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['users'], // 加载关联的用户
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== CompanyStatus.PENDING_REVIEW) {
      throw new BadRequestException('Company is not pending review');
    }

    const { approved, reason } = reviewDto;

    company.status = approved ? CompanyStatus.ACTIVE : CompanyStatus.DISABLED;
    
    const savedCompany = await this.companyRepository.save(company);

    // 发送用户通知
    if (approved && company.users && company.users.length > 0) {
      // 企业审核通过，给相关用户发送通知
      for (const user of company.users) {
        await this.notificationsService.notifyUserCompanyApproved(user.id, companyId);
      }

      // 🎯 新增逻辑：企业审核通过时，自动激活该企业下的owner用户
      const ownerUsers = company.users.filter(user => user.role === 'owner' && !user.isActive);
      if (ownerUsers.length > 0) {
        console.log(`📝 企业审核通过，自动激活 ${ownerUsers.length} 个owner用户`);
        
        for (const ownerUser of ownerUsers) {
          ownerUser.isActive = true;
          await this.userRepository.save(ownerUser);
          console.log(`✅ 已激活owner用户: ${ownerUser.email} (ID: ${ownerUser.id})`);
          
          // 发送用户激活通知（企业认证通过意味着用户也被激活）
          await this.notificationsService.notifyUserCompanyApproved(ownerUser.id, companyId);
        }
      }
    }

    // 发送管理员通知
    try {
      const companyName = this.extractTextFromMultiLang(company.name) || '未知企业';
      if (approved) {
        // 企业审核通过通知
        await this.adminNotificationsService.notifyCompanyApproved(companyId, companyName);
      } else {
        // 企业审核拒绝通知
        await this.adminNotificationsService.notifyCompanyRejected(companyId, companyName, reason);
      }
    } catch (error) {
      // 管理员通知发送失败不应该影响业务流程
      console.error('Failed to send admin notification for company review:', error);
    }

    return savedCompany;
  }

  // 获取所有企业列表
  async getAllCompanies(
    queryDto: CompanyQueryDto,
  ): Promise<PaginatedResult<Company>> {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      search,
      country,
      businessCategories, // 主字段，对应数据库
      businessTypes, // 前端兼容字段
      businessCategory, // 前端兼容字段
      companySize, // 主字段，对应数据库
      size, // 前端兼容字段
      verified,
      isTop100,
      createdStartDate,
      createdEndDate,
      minRating,
      maxRating,
      hasEmail,
      hasWebsite,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = queryDto;

    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.users', 'users');

    // 基础筛选条件
    if (status) {
      queryBuilder.andWhere('company.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('company.type = :type', { type });
    }

    if (country) {
      queryBuilder.andWhere('company.country = :country', { country });
    }

    // 业务类别查询 - 优先使用主字段
    const finalBusinessCategories = businessCategories || businessTypes;
    if (finalBusinessCategories && finalBusinessCategories.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(company.businessCategories, :businessCategories)', { 
        businessCategories: JSON.stringify(finalBusinessCategories) 
      });
    }

    // 前端兼容字段：单个businessCategory转换为数组查询
    if (businessCategory && !finalBusinessCategories) {
      queryBuilder.andWhere('JSON_CONTAINS(company.businessCategories, :businessCategory)', { 
        businessCategory: JSON.stringify(businessCategory) 
      });
    }

    // 企业规模查询 - 优先使用主字段
    const finalCompanySize = companySize || size;
    if (finalCompanySize) {
      queryBuilder.andWhere('company.companySize = :companySize', { companySize: finalCompanySize });
    }

    if (verified !== undefined) {
      queryBuilder.andWhere('company.verified = :verified', { verified });
    }

    if (isTop100 !== undefined) {
      queryBuilder.andWhere('company.isTop100 = :isTop100', { isTop100 });
    }

    if (createdStartDate && createdEndDate) {
      queryBuilder.andWhere('company.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(createdStartDate),
        endDate: new Date(createdEndDate + ' 23:59:59'),
      });
    }

    if (minRating !== undefined) {
      queryBuilder.andWhere('company.rating >= :minRating', { minRating });
    }

    if (maxRating !== undefined) {
      queryBuilder.andWhere('company.rating <= :maxRating', { maxRating });
    }

    if (hasEmail !== undefined) {
      if (hasEmail) {
        queryBuilder.andWhere('company.email IS NOT NULL AND company.email != ""');
      } else {
        queryBuilder.andWhere('(company.email IS NULL OR company.email = "")');
      }
    }

    if (hasWebsite !== undefined) {
      if (hasWebsite) {
        queryBuilder.andWhere('JSON_UNQUOTE(JSON_EXTRACT(company.profile, "$.website")) IS NOT NULL');
      } else {
        queryBuilder.andWhere('JSON_UNQUOTE(JSON_EXTRACT(company.profile, "$.website")) IS NULL');
      }
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // 搜索企业名称（多语言）
          qb.andWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(company.name, '$."zh-CN"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.name, '$."en"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.name, '$."es"')) LIKE :nameSearch)`,
            { nameSearch: `%${search}%` },
          );
          // 搜索企业描述
          qb.orWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(company.profile, '$."description"."zh-CN"')) LIKE :descSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.profile, '$."description"."en"')) LIKE :descSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(company.profile, '$."description"."es"')) LIKE :descSearch)`,
            { descSearch: `%${search}%` },
          );
          // 搜索用户邮箱
          qb.orWhere('users.email LIKE :emailSearch', { emailSearch: `%${search}%` });
          // 搜索企业邮箱
          qb.orWhere('company.email LIKE :companyEmailSearch', { companyEmailSearch: `%${search}%` });
        }),
      );
    }

    // 排序
    const sortField = sortBy === 'name' ? 'JSON_UNQUOTE(JSON_EXTRACT(company.name, \'$."zh-CN"\'))' : `company.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    const [companies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
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
    queryDto: ProductQueryDto,
  ): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 20,
      search,
      supplierId,
      supplierName,
      formulation,
      toxicity,
      activeIngredient,
      registrationNumber,
      registrationHolder,
      productCategory,
      country,
      exportRestrictedCountries,
      minOrderQuantityMin,
      minOrderQuantityMax,
      isListed,
      effectiveDateStart,
      effectiveDateEnd,
      firstApprovalDateStart,
      firstApprovalDateEnd,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
      hasControlMethods,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.status = :status', { status: ProductStatus.PENDING_REVIEW });

    // 附加筛选条件
    // TODO: 重新实现基于新Product实体结构的查询条件
    /*
    if (category) {
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.details, '$.productCategory')) LIKE :category)`,
        { category: `%${category}%` }
      );
    }
    */

    if (formulation) {
      queryBuilder.andWhere('product.formulation = :formulation', { formulation });
    }

    // TODO: 更新为新的有效成分查询结构
    /*
    if (activeIngredient) {
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."zh-CN"')) LIKE :activeIngredient OR ` +
          `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."en"')) LIKE :activeIngredient OR ` +
          `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."es"')) LIKE :activeIngredient)`,
        { activeIngredient: `%${activeIngredient}%` }
      );
    }
    */

    // TODO: 移除不存在的字段查询条件
    /*
    if (casNo) {
      queryBuilder.andWhere('product.casNo = :casNo', { casNo });
    }

    if (companyId) {
      queryBuilder.andWhere('supplier.id = :companyId', { companyId });
    }

    if (companyType) {
      queryBuilder.andWhere('supplier.type = :companyType', { companyType });
    }
    */

    if (country) {
      queryBuilder.andWhere('supplier.country = :country', { country });
    }

    // TODO: 移除价格和库存相关字段
    /*
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (hasStock !== undefined) {
      if (hasStock) {
        queryBuilder.andWhere('product.stock > 0');
      } else {
        queryBuilder.andWhere('(product.stock IS NULL OR product.stock <= 0)');
      }
    }

    // TODO: 移除不存在的字段查询条件
    /*
    if (certified !== undefined) {
      queryBuilder.andWhere('product.certified = :certified', { certified });
    }

    if (packagingSpecs && packagingSpecs.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(JSON_EXTRACT(product.details, "$.packagingSpecs"), :packagingSpecs)', {
        packagingSpecs: JSON.stringify(packagingSpecs)
      });
    }
    */

    if (createdStartDate && createdEndDate) {
      queryBuilder.andWhere('product.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(createdStartDate),
        endDate: new Date(createdEndDate + ' 23:59:59'),
      });
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // 搜索产品名称（多语言）
          qb.where(
            `(JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."zh-CN"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."en"')) LIKE :nameSearch)`,
            { nameSearch: `%${search}%` }
          );
          // 搜索农药名称（多语言）
          qb.orWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."zh-CN"')) LIKE :pesticideSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, '$."en"')) LIKE :pesticideSearch)`,
            { pesticideSearch: `%${search}%` }
          );
          // 搜索登记证号
          qb.orWhere('product.registrationNumber LIKE :regSearch', { regSearch: `%${search}%` });
          // 搜索供应商名称 
          qb.orWhere('supplier.name LIKE :supplierSearch', { supplierSearch: `%${search}%` });
        })
      );
    }

    // 排序
    const sortField = sortBy === 'name' ? 'JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$."zh-CN"\'))' : `product.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
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

  // 审核产品
  async reviewProduct(
    productId: number,
    reviewDto: ReviewProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['supplier'], // 加载供应商信息用于通知
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

    const savedProduct = await this.productRepository.save(product);

    // 发送管理员通知
    try {
      const productName = this.extractTextFromMultiLang(product.name) || '未知产品';
      if (approved) {
        // 产品审核通过通知
        await this.adminNotificationsService.notifyProductApproved(productId, productName);
      } else {
        // 产品审核拒绝通知
        await this.adminNotificationsService.notifyProductRejected(productId, productName, reason);
      }
    } catch (error) {
      // 管理员通知发送失败不应该影响业务流程
      console.error('Failed to send admin notification for product review:', error);
    }

    return savedProduct;
  }

  // 获取所有产品列表
  async getAllProducts(
    queryDto: ProductQueryDto,
  ): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      supplierId,
      supplierName,
      formulation,
      toxicity,
      activeIngredient,
      registrationNumber,
      registrationHolder,
      productCategory,
      country,
      exportRestrictedCountries,
      minOrderQuantityMin,
      minOrderQuantityMax,
      isListed,
      effectiveDateStart,
      effectiveDateEnd,
      firstApprovalDateStart,
      firstApprovalDateEnd,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate,
      hasControlMethods,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.supplier', 'supplier');

    // 基础筛选条件
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // TODO: 重新实现基于新Product实体结构的查询条件
    /*
    if (category) {
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.details, '$.productCategory')) LIKE :category)`,
        { category: `%${category}%` }
      );
    }
    */

    if (formulation) {
      queryBuilder.andWhere('product.formulation = :formulation', { formulation });
    }

    // TODO: 更新为新的有效成分查询结构
    /*
    if (activeIngredient) {
      queryBuilder.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."zh-CN"')) LIKE :activeIngredient OR ` +
          `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."en"')) LIKE :activeIngredient OR ` +
          `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."es"')) LIKE :activeIngredient)`,
        { activeIngredient: `%${activeIngredient}%` }
      );
    }
    */

    // TODO: 移除不存在的字段查询条件
    /*
    if (casNo) {
      queryBuilder.andWhere('product.casNo = :casNo', { casNo });
    }

    if (companyId) {
      queryBuilder.andWhere('supplier.id = :companyId', { companyId });
    }

    if (companyType) {
      queryBuilder.andWhere('supplier.type = :companyType', { companyType });
    }
    */

    if (country) {
      queryBuilder.andWhere('supplier.country = :country', { country });
    }

    // TODO: 移除价格和库存相关字段
    /*
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (hasStock !== undefined) {
      if (hasStock) {
        queryBuilder.andWhere('product.stock > 0');
      } else {
        queryBuilder.andWhere('(product.stock IS NULL OR product.stock <= 0)');
      }
    }
    */

    // TODO: 移除不存在的字段查询条件
    /*
    if (certified !== undefined) {
      queryBuilder.andWhere('product.certified = :certified', { certified });
    }

    if (packagingSpecs && packagingSpecs.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(JSON_EXTRACT(product.details, "$.packagingSpecs"), :packagingSpecs)', {
        packagingSpecs: JSON.stringify(packagingSpecs)
      });
    }
    */

    if (createdStartDate && createdEndDate) {
      queryBuilder.andWhere('product.createdAt BETWEEN :createdStartDate AND :createdEndDate', {
        createdStartDate: new Date(createdStartDate),
        createdEndDate: new Date(createdEndDate + ' 23:59:59'),
      });
    }

    if (updatedStartDate && updatedEndDate) {
      queryBuilder.andWhere('product.updatedAt BETWEEN :updatedStartDate AND :updatedEndDate', {
        updatedStartDate: new Date(updatedStartDate),
        updatedEndDate: new Date(updatedEndDate + ' 23:59:59'),
      });
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // 搜索产品名称（多语言）
          qb.andWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."zh-CN"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."en"')) LIKE :nameSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.name, '$."es"')) LIKE :nameSearch)`,
            { nameSearch: `%${search}%` }
          );
          // 搜索产品描述
          qb.orWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(product.description, '$."zh-CN"')) LIKE :descSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.description, '$."en"')) LIKE :descSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.description, '$."es"')) LIKE :descSearch)`,
            { descSearch: `%${search}%` }
          );
          // 搜索有效成分
          qb.orWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."zh-CN"')) LIKE :ingredientSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."en"')) LIKE :ingredientSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(product.activeIngredient, '$."es"')) LIKE :ingredientSearch)`,
            { ingredientSearch: `%${search}%` }
          );
          // 搜索CAS号
          qb.orWhere('product.casNo LIKE :casSearch', { casSearch: `%${search}%` });
          // 搜索企业名称
          qb.orWhere(
            `(JSON_UNQUOTE(JSON_EXTRACT(supplier.name, '$."zh-CN"')) LIKE :supplierSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(supplier.name, '$."en"')) LIKE :supplierSearch OR ` +
              `JSON_UNQUOTE(JSON_EXTRACT(supplier.name, '$."es"')) LIKE :supplierSearch)`,
            { supplierSearch: `%${search}%` }
          );
        })
      );
    }

    // 排序
    const sortField = sortBy === 'name' ? 'JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$."zh-CN"\'))' : `product.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
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

  // 测试用户查询 - 临时调试方法
  async testGetAllUsers(): Promise<any> {
    try {
      console.log('开始测试用户查询...');
      
      // 最简单的查询
      const users = await this.userRepository.find({ 
        take: 5 
      });
      
      console.log('简单查询成功，返回', users.length, '条记录');
      
      return {
        message: '测试成功',
        count: users.length,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }))
      };
    } catch (error) {
      console.error('测试查询失败：', error);
      throw error;
    }
  }

  // 获取所有用户列表
  async getAllUsers(
    queryDto: UserQueryDto,
  ): Promise<PaginatedResult<User>> {
    try {
      console.log('开始执行getAllUsers查询...');
      console.log('userRepository:', !!this.userRepository);
      
      // 最简单的查询
      const users = await this.userRepository.find({
        take: 5,
        order: { createdAt: 'DESC' }
      });
      
      console.log('简单查询成功，返回', users.length, '条记录');
      
      return {
        data: users,
        meta: {
          totalItems: users.length,
          itemCount: users.length,
          itemsPerPage: 5,
          totalPages: 1,
          currentPage: 1,
        },
      };
    } catch (error) {
      console.error('getAllUsers查询失败：', error.message);
      console.error('错误堆栈：', error.stack);
      throw error;
    }
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
  async createProduct(createProductDto: AdminCreateProductDto): Promise<Product> {
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
    updateProductDto: AdminUpdateProductDto,
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
      keyword,
      buyerName,
      supplierName,
      productName,
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

    // 关键字模糊查询 - 支持询价单号、买方企业名、供应商企业名、产品名称
    if (keyword) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('inquiry.inquiryNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(buyer.name, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(buyer.name, \'$.en\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(supplier.name, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(supplier.name, \'$.en\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$.en\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, \'$.en\')) LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    // 买方企业名称模糊查询
    if (buyerName) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('JSON_UNQUOTE(JSON_EXTRACT(buyer.name, \'$."zh-CN"\')) LIKE :buyerName', { buyerName: `%${buyerName}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(buyer.name, \'$.en\')) LIKE :buyerName', { buyerName: `%${buyerName}%` });
        }),
      );
    }

    // 供应商企业名称模糊查询
    if (supplierName) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('JSON_UNQUOTE(JSON_EXTRACT(supplier.name, \'$."zh-CN"\')) LIKE :supplierName', { supplierName: `%${supplierName}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(supplier.name, \'$.en\')) LIKE :supplierName', { supplierName: `%${supplierName}%` });
        }),
      );
    }

    // 产品名称模糊查询
    if (productName) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$."zh-CN"\')) LIKE :productName', { productName: `%${productName}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$.en\')) LIKE :productName', { productName: `%${productName}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, \'$."zh-CN"\')) LIKE :productName', { productName: `%${productName}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, \'$.en\')) LIKE :productName', { productName: `%${productName}%` });
        }),
      );
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
      relations: ['buyer', 'supplier', 'items', 'items.product'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // 验证状态转换的合理性
    if (!this.isValidStatusTransition(inquiry.status, updateDto.status)) {
      const currentStatusText = this.getInquiryStatusText(inquiry.status);
      const targetStatusText = this.getInquiryStatusText(updateDto.status);
      const allowedTransitions = this.getAllowedTransitions(inquiry.status);
      
      if (allowedTransitions.length === 0) {
        throw new BadRequestException(
          `当前状态"${currentStatusText}"为终态，不能修改为其他状态`
        );
      } else {
        const allowedTransitionsText = allowedTransitions.map(status => this.getInquiryStatusText(status)).join('、');
        throw new BadRequestException(
          `状态"${currentStatusText}"不能转换为"${targetStatusText}"，只能转换为：${allowedTransitionsText}`
        );
      }
    }

    const oldStatus = inquiry.status;

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

    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 发送管理员通知（针对重要状态变更）
    try {
      const productName = inquiry.items?.[0]?.product?.name ? 
        this.extractTextFromMultiLang(inquiry.items[0].product.name) : '未知产品';
      const buyerName = inquiry.buyer?.name ? 
        this.extractTextFromMultiLang(inquiry.buyer.name) : '未知买方';
      
      // 根据状态变更发送不同的通知
      if (updateDto.status === InquiryStatus.CONFIRMED) {
        // 询价单确认，交易成功
        await this.adminNotificationsService.notifyInquiryConfirmed(
          inquiryId, 
          buyerName, 
          productName
        );
      } else if (updateDto.status === InquiryStatus.DECLINED) {
        // 询价单被拒绝
        await this.adminNotificationsService.notifyInquiryDeclined(
          inquiryId, 
          buyerName, 
          productName, 
          updateDto.declineReason
        );
      }
      // 其他状态变更也可能需要通知，但不是核心业务流程
    } catch (error) {
      // 管理员通知发送失败不应该影响业务流程
      console.error('Failed to send admin notification for inquiry status update:', error);
    }

    return savedInquiry;
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

  /**
   * 获取询盘状态的中文描述
   */
  private getInquiryStatusText(status: InquiryStatus): string {
    const statusTextMap: Record<InquiryStatus, string> = {
      [InquiryStatus.PENDING_QUOTE]: '待报价',
      [InquiryStatus.QUOTED]: '已报价',
      [InquiryStatus.CONFIRMED]: '已确认',
      [InquiryStatus.DECLINED]: '已拒绝',
      [InquiryStatus.EXPIRED]: '已过期',
      [InquiryStatus.CANCELLED]: '已取消',
    };
    
    return statusTextMap[status] || status;
  }

  /**
   * 获取当前状态允许转换的目标状态列表
   */
  private getAllowedTransitions(currentStatus: InquiryStatus): InquiryStatus[] {
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
      [InquiryStatus.CONFIRMED]: [],
      [InquiryStatus.DECLINED]: [],
      [InquiryStatus.EXPIRED]: [],
      [InquiryStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus] || [];
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
      keyword,
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

    // 关键字模糊查询
    if (keyword) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('sampleRequest.sampleReqNo LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(buyer.name, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(buyer.name, \'$."en"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(supplier.name, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(supplier.name, \'$."en"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.name, \'$."en"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, \'$."zh-CN"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(product.pesticideName, \'$."en"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.productSnapshot, \'$."name"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.productSnapshot, \'$."category"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.productSnapshot, \'$."activeIngredient"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.details, \'$."purpose"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.details, \'$."shippingAddress"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.trackingInfo, \'$."carrier"\')) LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('JSON_UNQUOTE(JSON_EXTRACT(sampleRequest.trackingInfo, \'$."trackingNumber"\')) LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
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

  // 登记申请业务流程管理
  async getRegistrationRequests(
    queryDto: RegistrationRequestQueryDto,
  ): Promise<PaginatedResult<RegistrationRequest>> {
    const {
      page = 1,
      limit = 20,
      regReqNo,
      status,
      buyerId,
      supplierId,
      productId,
      targetCountry,
      createdStartDate,
      createdEndDate,
      keyword,
    } = queryDto;

    const queryBuilder = this.registrationRequestRepository
      .createQueryBuilder('registrationRequest')
      .leftJoinAndSelect('registrationRequest.buyer', 'buyer')
      .leftJoinAndSelect('registrationRequest.supplier', 'supplier')
      .leftJoinAndSelect('registrationRequest.product', 'product');

    if (regReqNo) {
      queryBuilder.andWhere('registrationRequest.regReqNo LIKE :regReqNo', {
        regReqNo: `%${regReqNo}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('registrationRequest.status = :status', { status });
    }

    if (buyerId) {
      queryBuilder.andWhere('registrationRequest.buyerId = :buyerId', { buyerId });
    }

    if (supplierId) {
      queryBuilder.andWhere('registrationRequest.supplierId = :supplierId', { supplierId });
    }

    if (productId) {
      queryBuilder.andWhere('registrationRequest.productId = :productId', { productId });
    }

    if (targetCountry) {
      queryBuilder.andWhere('JSON_EXTRACT(registrationRequest.details, "$.targetCountry") LIKE :targetCountry', {
        targetCountry: `%${targetCountry}%`,
      });
    }

    if (createdStartDate) {
      queryBuilder.andWhere('DATE(registrationRequest.createdAt) >= :createdStartDate', {
        createdStartDate,
      });
    }

    if (createdEndDate) {
      queryBuilder.andWhere('DATE(registrationRequest.createdAt) <= :createdEndDate', {
        createdEndDate,
      });
    }

    if (keyword) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('registrationRequest.regReqNo LIKE :keyword', {
            keyword: `%${keyword}%`,
          })
            .orWhere("JSON_EXTRACT(buyer.name, '$.\"zh-CN\"') LIKE :keyword", {
              keyword: `%${keyword}%`,
            })
            .orWhere("JSON_EXTRACT(buyer.name, '$.en') LIKE :keyword", {
              keyword: `%${keyword}%`,
            })
            .orWhere("JSON_EXTRACT(supplier.name, '$.\"zh-CN\"') LIKE :keyword", {
              keyword: `%${keyword}%`,
            })
            .orWhere("JSON_EXTRACT(supplier.name, '$.en') LIKE :keyword", {
              keyword: `%${keyword}%`,
            })
            .orWhere("JSON_EXTRACT(product.name, '$.\"zh-CN\"') LIKE :keyword", {
              keyword: `%${keyword}%`,
            })
            .orWhere("JSON_EXTRACT(product.name, '$.en') LIKE :keyword", {
              keyword: `%${keyword}%`,
            })
            .orWhere("JSON_EXTRACT(registrationRequest.details, '$.targetCountry') LIKE :keyword", {
              keyword: `%${keyword}%`,
            });
        }),
      );
    }

    const [registrationRequests, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('registrationRequest.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: registrationRequests,
      meta: {
        totalItems: total,
        itemCount: registrationRequests.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getRegistrationRequestById(registrationRequestId: number): Promise<RegistrationRequest> {
    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id: registrationRequestId },
      relations: ['buyer', 'supplier', 'product'],
    });

    if (!registrationRequest) {
      throw new NotFoundException('Registration request not found');
    }

    return registrationRequest;
  }

  async updateRegistrationRequestStatus(
    registrationRequestId: number,
    updateDto: UpdateRegistrationRequestStatusDto,
  ): Promise<RegistrationRequest> {
    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id: registrationRequestId },
      relations: ['buyer', 'supplier', 'product'],
    });

    if (!registrationRequest) {
      throw new NotFoundException('Registration request not found');
    }

    // 验证状态转换的合理性
    if (!this.isValidRegistrationRequestStatusTransition(registrationRequest.status, updateDto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${registrationRequest.status} to ${updateDto.status}`,
      );
    }

    // 更新状态
    registrationRequest.status = updateDto.status;

    // 添加状态说明
    if (updateDto.statusNote) {
      const currentDetails = registrationRequest.details as any;
      const updatedDetails = {
        ...currentDetails,
        statusNote: updateDto.statusNote,
        lastUpdatedBy: updateDto.operatedBy,
        statusHistory: [
          ...(currentDetails.statusHistory || []),
          {
            status: updateDto.status,
            note: updateDto.statusNote,
            updatedBy: updateDto.operatedBy,
            updatedAt: new Date().toISOString(),
          },
        ],
      };
      registrationRequest.details = updatedDetails;
    }

    return this.registrationRequestRepository.save(registrationRequest);
  }

  async getRegistrationRequestStats(): Promise<RegistrationRequestStatsDto> {
    const stats = await this.registrationRequestRepository
      .createQueryBuilder('registrationRequest')
      .select('registrationRequest.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('registrationRequest.status')
      .getRawMany();

    const result: RegistrationRequestStatsDto = {
      pendingResponse: 0,
      inProgress: 0,
      completed: 0,
      declined: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      const count = parseInt(stat.count);
      result.total += count;

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
    });

    return result;
  }

  async deleteRegistrationRequest(registrationRequestId: number): Promise<void> {
    const registrationRequest = await this.registrationRequestRepository.findOne({
      where: { id: registrationRequestId },
    });

    if (!registrationRequest) {
      throw new NotFoundException('Registration request not found');
    }

    // 只有待回复和已取消状态的登记申请可以删除
    if (![RegistrationRequestStatus.PENDING_RESPONSE, RegistrationRequestStatus.CANCELLED].includes(registrationRequest.status)) {
      throw new BadRequestException(
        'Only pending response or cancelled registration requests can be deleted',
      );
    }

    await this.registrationRequestRepository.remove(registrationRequest);
  }

  private isValidRegistrationRequestStatusTransition(
    currentStatus: RegistrationRequestStatus,
    newStatus: RegistrationRequestStatus,
  ): boolean {
    const validTransitions: Record<RegistrationRequestStatus, RegistrationRequestStatus[]> = {
      [RegistrationRequestStatus.PENDING_RESPONSE]: [
        RegistrationRequestStatus.IN_PROGRESS,
        RegistrationRequestStatus.DECLINED,
        RegistrationRequestStatus.CANCELLED,
      ],
      [RegistrationRequestStatus.IN_PROGRESS]: [
        RegistrationRequestStatus.COMPLETED,
        RegistrationRequestStatus.DECLINED,
        RegistrationRequestStatus.CANCELLED,
      ],
      [RegistrationRequestStatus.COMPLETED]: [], // 已完成状态不能再转换
      [RegistrationRequestStatus.DECLINED]: [], // 已拒绝状态不能再转换
      [RegistrationRequestStatus.CANCELLED]: [], // 已取消状态不能再转换
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // 管理员账户管理
  async getAdminUsers(
    queryDto: AdminUserQueryDto,
  ): Promise<PaginatedResult<AdminUser>> {
    const {
      page = 1,
      limit = 20,
      username,
      role,
      isActive,
      createdStartDate,
      createdEndDate,
    } = queryDto;

    const queryBuilder = this.adminUserRepository
      .createQueryBuilder('adminUser');

    if (username) {
      queryBuilder.andWhere('adminUser.username LIKE :username', {
        username: `%${username}%`,
      });
    }

    if (role) {
      queryBuilder.andWhere('adminUser.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('adminUser.isActive = :isActive', { isActive });
    }

    if (createdStartDate) {
      queryBuilder.andWhere('DATE(adminUser.createdAt) >= :createdStartDate', {
        createdStartDate,
      });
    }

    if (createdEndDate) {
      queryBuilder.andWhere('DATE(adminUser.createdAt) <= :createdEndDate', {
        createdEndDate,
      });
    }

    const [adminUsers, total] = await queryBuilder
      .select([
        'adminUser.id',
        'adminUser.username',
        'adminUser.role',
        'adminUser.isActive',
        'adminUser.createdAt',
        'adminUser.updatedAt',
        'adminUser.lastLoginAt',
      ])
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('adminUser.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: adminUsers,
      meta: {
        totalItems: total,
        itemCount: adminUsers.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getAdminUserById(adminUserId: number): Promise<AdminUser> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminUserId },
      select: [
        'id',
        'username',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
        'lastLoginAt',
      ],
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    return adminUser;
  }

  async createAdminUser(createAdminUserDto: CreateAdminUserDto): Promise<AdminUser> {
    // 检查用户名是否已存在
    const existingUser = await this.adminUserRepository.findOne({
      where: { username: createAdminUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createAdminUserDto.password, saltRounds);

    const adminUser = this.adminUserRepository.create({
      username: createAdminUserDto.username,
      password: hashedPassword,
      role: createAdminUserDto.role,
      isActive: createAdminUserDto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedUser = await this.adminUserRepository.save(adminUser);

    // 返回时不包含密码
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as AdminUser;
  }

  async updateAdminUser(
    adminUserId: number,
    updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<AdminUser> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    // 如果更新用户名，检查是否已存在
    if (updateAdminUserDto.username && updateAdminUserDto.username !== adminUser.username) {
      const existingUser = await this.adminUserRepository.findOne({
        where: { username: updateAdminUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    Object.assign(adminUser, updateAdminUserDto);
    adminUser.updatedAt = new Date();

    const savedUser = await this.adminUserRepository.save(adminUser);

    // 返回时不包含密码
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as AdminUser;
  }

  async changePassword(
    adminUserId: number,
    changePasswordDto: AdminChangePasswordDto,
  ): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      adminUser.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // 加密新密码
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    adminUser.password = hashedNewPassword;
    adminUser.updatedAt = new Date();

    await this.adminUserRepository.save(adminUser);
  }

  async resetPassword(
    adminUserId: number,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    // 加密新密码
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

    adminUser.password = hashedNewPassword;
    adminUser.updatedAt = new Date();

    await this.adminUserRepository.save(adminUser);
  }

  async toggleAdminUserStatus(adminUserId: number): Promise<AdminUser> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    adminUser.isActive = !adminUser.isActive;
    adminUser.updatedAt = new Date();

    const savedUser = await this.adminUserRepository.save(adminUser);

    // 返回时不包含密码
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as AdminUser;
  }

  async deleteAdminUser(adminUserId: number): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    // 检查是否为超级管理员的最后一个账户
    if (adminUser.role === 'super_admin') {
      const superAdminCount = await this.adminUserRepository.count({
        where: { role: 'super_admin', isActive: true },
      });

      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last active super admin user',
        );
      }
    }

    await this.adminUserRepository.remove(adminUser);
  }

  async getAdminUserStats(): Promise<AdminUserStatsDto> {
    const totalAdmins = await this.adminUserRepository.count();
    const activeAdmins = await this.adminUserRepository.count({
      where: { isActive: true },
    });
    const inactiveAdmins = totalAdmins - activeAdmins;

    const roleStats = await this.adminUserRepository
      .createQueryBuilder('adminUser')
      .select('adminUser.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('adminUser.isActive = :isActive', { isActive: true })
      .groupBy('adminUser.role')
      .getRawMany();

    const result: AdminUserStatsDto = {
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      superAdmins: 0,
      admins: 0,
      moderators: 0,
    };

    roleStats.forEach((stat) => {
      const count = parseInt(stat.count);
      switch (stat.role) {
        case 'super_admin':
          result.superAdmins = count;
          break;
        case 'admin':
          result.admins = count;
          break;
        case 'moderator':
          result.moderators = count;
          break;
      }
    });

    return result;
  }

  // ===================== 权限管理相关方法 =====================

  /**
   * 获取所有权限分组信息
   */
  async getPermissionGroups(): Promise<PermissionGroupDto[]> {
    const permissionGroups = [
      {
        groupName: 'COMPANY',
        groupDisplayName: '企业管理',
        permissions: [
          { permission: AdminPermission.COMPANY_VIEW, description: '查看企业信息' },
          { permission: AdminPermission.COMPANY_CREATE, description: '创建企业' },
          { permission: AdminPermission.COMPANY_UPDATE, description: '更新企业信息' },
          { permission: AdminPermission.COMPANY_DELETE, description: '删除企业' },
          { permission: AdminPermission.COMPANY_REVIEW, description: '审核企业' },
        ]
      },
      {
        groupName: 'PRODUCT',
        groupDisplayName: '产品管理',
        permissions: [
          { permission: AdminPermission.PRODUCT_VIEW, description: '查看产品信息' },
          { permission: AdminPermission.PRODUCT_CREATE, description: '创建产品' },
          { permission: AdminPermission.PRODUCT_UPDATE, description: '更新产品信息' },
          { permission: AdminPermission.PRODUCT_DELETE, description: '删除产品' },
          { permission: AdminPermission.PRODUCT_REVIEW, description: '审核产品' },
        ]
      },
      {
        groupName: 'USER',
        groupDisplayName: '用户管理',
        permissions: [
          { permission: AdminPermission.USER_VIEW, description: '查看用户信息' },
          { permission: AdminPermission.USER_CREATE, description: '创建用户' },
          { permission: AdminPermission.USER_UPDATE, description: '更新用户信息' },
          { permission: AdminPermission.USER_DELETE, description: '删除用户' },
          { permission: AdminPermission.USER_MANAGE_SUBSCRIPTION, description: '管理用户订阅' },
        ]
      },
      {
        groupName: 'BUSINESS',
        groupDisplayName: '业务流程管理',
        permissions: [
          { permission: AdminPermission.INQUIRY_VIEW, description: '查看询价单' },
          { permission: AdminPermission.INQUIRY_MANAGE, description: '管理询价单' },
          { permission: AdminPermission.SAMPLE_REQUEST_VIEW, description: '查看样品申请' },
          { permission: AdminPermission.SAMPLE_REQUEST_MANAGE, description: '管理样品申请' },
          { permission: AdminPermission.REGISTRATION_REQUEST_VIEW, description: '查看登记申请' },
          { permission: AdminPermission.REGISTRATION_REQUEST_MANAGE, description: '管理登记申请' },
          { permission: AdminPermission.ORDER_VIEW, description: '查看订单' },
          { permission: AdminPermission.ORDER_MANAGE, description: '管理订单' },
        ]
      },
      {
        groupName: 'PLAN',
        groupDisplayName: '会员计划管理',
        permissions: [
          { permission: AdminPermission.PLAN_VIEW, description: '查看会员计划' },
          { permission: AdminPermission.PLAN_CREATE, description: '创建会员计划' },
          { permission: AdminPermission.PLAN_UPDATE, description: '更新会员计划' },
          { permission: AdminPermission.PLAN_DELETE, description: '删除会员计划' },
        ]
      },
      {
        groupName: 'SYSTEM',
        groupDisplayName: '系统管理',
        permissions: [
          { permission: AdminPermission.ADMIN_MANAGE, description: '管理员账户管理' },
          { permission: AdminPermission.DICTIONARY_MANAGE, description: '字典管理' },
          { permission: AdminPermission.SYSTEM_CONFIG, description: '系统配置' },
          { permission: AdminPermission.AUDIT_LOG_VIEW, description: '查看审计日志' },
          { permission: AdminPermission.FILE_MANAGE, description: '文件管理' },
        ]
      },
      {
        groupName: 'ANALYTICS',
        groupDisplayName: '统计分析',
        permissions: [
          { permission: AdminPermission.ANALYTICS_VIEW, description: '查看统计数据' },
          { permission: AdminPermission.DASHBOARD_VIEW, description: '查看仪表盘' },
        ]
      },
    ];

    return permissionGroups;
  }

  /**
   * 获取角色模板信息
   */
  async getRoleTemplates(): Promise<RoleTemplateDto[]> {
    return [
      {
        role: 'super_admin',
        displayName: '超级管理员',
        description: '拥有系统所有权限，可以管理所有功能模块',
        defaultPermissions: Object.values(AdminPermission),
      },
      {
        role: 'admin',
        displayName: '管理员',
        description: '拥有大部分管理权限，可以管理企业、产品、用户等核心功能',
        defaultPermissions: [...DEFAULT_ROLE_PERMISSIONS.admin],
      },
      {
        role: 'moderator',
        displayName: '审核员',
        description: '主要负责内容审核，可以审核企业和产品',
        defaultPermissions: [...DEFAULT_ROLE_PERMISSIONS.moderator],
      },
    ];
  }

  /**
   * 获取管理员用户权限信息
   */
  async getAdminUserPermissions(userId: number): Promise<AdminUserPermissionDto> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!adminUser) {
      throw new NotFoundException('管理员用户不存在');
    }

    return {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      permissions: adminUser.permissions || [],
      allPermissions: adminUser.getAllPermissions(),
      isActive: adminUser.isActive,
    };
  }

  /**
   * 为管理员用户分配权限
   */
  async assignPermissions(userId: number, dto: AssignPermissionsDto): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!adminUser) {
      throw new NotFoundException('管理员用户不存在');
    }

    // 超级管理员不需要分配具体权限
    if (adminUser.role === 'super_admin') {
      throw new BadRequestException('超级管理员拥有所有权限，无需分配具体权限');
    }

    // 更新权限
    adminUser.permissions = dto.permissions;
    adminUser.updatedAt = new Date();
    
    await this.adminUserRepository.save(adminUser);
  }

  /**
   * 根据角色重置用户权限
   */
  async resetPermissionsByRole(userId: number): Promise<void> {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!adminUser) {
      throw new NotFoundException('管理员用户不存在');
    }

    // 超级管理员不需要重置权限
    if (adminUser.role === 'super_admin') {
      throw new BadRequestException('超级管理员拥有所有权限，无需重置');
    }

    // 根据角色设置默认权限
    adminUser.permissions = PermissionHelper.getDefaultPermissionsByRole(adminUser.role);
    adminUser.updatedAt = new Date();
    
    await this.adminUserRepository.save(adminUser);
  }

  /**
   * 批量更新管理员用户权限
   */
  async batchUpdatePermissions(updates: Array<{ userId: number; permissions: AdminPermission[] }>): Promise<void> {
    const userIds = updates.map(update => update.userId);
    const adminUsers = await this.adminUserRepository.findByIds(userIds);

    if (adminUsers.length !== userIds.length) {
      throw new BadRequestException('部分管理员用户不存在');
    }

    // 检查是否包含超级管理员
    const superAdminUsers = adminUsers.filter(user => user.role === 'super_admin');
    if (superAdminUsers.length > 0) {
      throw new BadRequestException('不能修改超级管理员的权限');
    }

    // 批量更新
    const updatePromises = updates.map(async (update) => {
      const adminUser = adminUsers.find(user => user.id === update.userId);
      if (adminUser) {
        adminUser.permissions = update.permissions;
        adminUser.updatedAt = new Date();
        return this.adminUserRepository.save(adminUser);
      }
    });

    await Promise.all(updatePromises);
  }
}
