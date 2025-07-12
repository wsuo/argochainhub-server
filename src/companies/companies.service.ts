import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyType, CompanyStatus } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { SearchCompaniesDto } from './dto/search-companies.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async getCompanyProfile(user: User): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: user.companyId },
      relations: ['users'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompanyProfile(
    user: User,
    updateDto: UpdateCompanyProfileDto,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: user.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 更新企业信息
    Object.assign(company, updateDto);
    
    return this.companyRepository.save(company);
  }

  async getSubscriptionStatus(user: User) {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        companyId: user.companyId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { endDate: 'DESC' },
    });

    if (!activeSubscription) {
      return {
        hasActiveSubscription: false,
        message: 'No active subscription found',
      };
    }

    const now = new Date();
    const isExpired = activeSubscription.endDate < now;

    if (isExpired) {
      return {
        hasActiveSubscription: false,
        message: 'Subscription expired',
        expiredSubscription: {
          planName: activeSubscription.plan.name,
          endDate: activeSubscription.endDate,
        },
      };
    }

    return {
      hasActiveSubscription: true,
      subscription: {
        planName: activeSubscription.plan.name,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        type: activeSubscription.type,
        specs: activeSubscription.plan.specs,
      },
    };
  }

  async searchSuppliers(
    searchDto: SearchCompaniesDto,
  ): Promise<PaginatedResult<Company>> {
    const { search, page = 1, limit = 20 } = searchDto;
    
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .where('company.type = :type', { type: CompanyType.SUPPLIER })
      .andWhere('company.status = :status', { status: CompanyStatus.ACTIVE });

    if (search) {
      queryBuilder.andWhere(
        '(company.name LIKE :search OR JSON_EXTRACT(company.profile, "$.description") LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [companies, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('company.isTop100', 'DESC')
      .addOrderBy('company.rating', 'DESC')
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

  async getTop100Suppliers(): Promise<Company[]> {
    return this.companyRepository.find({
      where: {
        type: CompanyType.SUPPLIER,
        status: CompanyStatus.ACTIVE,
        isTop100: true,
      },
      order: { rating: 'DESC' },
      take: 100,
    });
  }

  async getSupplierDetail(id: number): Promise<Company> {
    const supplier = await this.companyRepository.findOne({
      where: {
        id,
        type: CompanyType.SUPPLIER,
        status: CompanyStatus.ACTIVE,
      },
      relations: ['products'],
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }
}