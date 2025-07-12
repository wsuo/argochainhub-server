import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../entities/admin-user.entity';
import { Company, CompanyType, CompanyStatus } from '../entities/company.entity';
import { User, UserRole } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async seedAll() {
    this.logger.log('Starting database seeding...');
    
    await this.seedAdminUsers();
    await this.seedPlans();
    await this.seedCompaniesAndUsers();
    
    this.logger.log('Database seeding completed');
  }

  private async seedAdminUsers() {
    this.logger.log('Seeding admin users...');

    const existingAdmin = await this.adminUserRepository.findOne({
      where: { username: 'superadmin' }
    });

    if (existingAdmin) {
      this.logger.log('Admin users already exist, skipping...');
      return;
    }

    const adminUsers = [
      {
        username: 'superadmin',
        password: await bcrypt.hash('Admin123!', 10),
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'admin',
        password: await bcrypt.hash('Admin123!', 10),
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await this.adminUserRepository.save(adminUsers);
    this.logger.log('Admin users seeded successfully');
  }

  private async seedPlans() {
    this.logger.log('Seeding subscription plans...');

    const existingPlan = await this.planRepository.findOne({
      where: { name: '基础版' }
    });

    if (existingPlan) {
      this.logger.log('Plans already exist, skipping...');
      return;
    }

    const plans = [
      {
        name: '基础版',
        price: 99.00,
        durationDays: 30,
        specs: {
          userAccounts: 3,
          aiQueriesMonthly: 100,
          inquiriesMonthly: 20,
          sampleRequestsMonthly: 5,
          registrationRequestsMonthly: 3,
          productsLimit: 10,
          supportLevel: 'basic'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: '专业版',
        price: 299.00,
        durationDays: 30,
        specs: {
          userAccounts: 10,
          aiQueriesMonthly: 500,
          inquiriesMonthly: 100,
          sampleRequestsMonthly: 20,
          registrationRequestsMonthly: 10,
          productsLimit: 50,
          supportLevel: 'professional'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: '企业版',
        price: 999.00,
        durationDays: 30,
        specs: {
          userAccounts: 50,
          aiQueriesMonthly: 2000,
          inquiriesMonthly: 500,
          sampleRequestsMonthly: 100,
          registrationRequestsMonthly: 50,
          productsLimit: 200,
          supportLevel: 'enterprise'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await this.planRepository.save(plans);
    this.logger.log('Subscription plans seeded successfully');
  }

  private async seedCompaniesAndUsers() {
    this.logger.log('Seeding companies and users...');

    const existingBuyer = await this.companyRepository.findOne({
      where: { name: '阳光农业采购有限公司' }
    });

    if (existingBuyer) {
      this.logger.log('Companies already exist, skipping...');
      return;
    }

    // 创建买家企业
    const buyerCompany = await this.companyRepository.save({
      name: '阳光农业采购有限公司',
      type: CompanyType.BUYER,
      status: CompanyStatus.ACTIVE,
      profile: {
        description: '专业从事农化产品采购的大型企业',
        address: '北京市朝阳区农业科技园区88号',
        phone: '010-12345678',
        website: 'https://yangguang-agri.com',
        certificates: ['农药经营许可证', 'ISO9001质量管理体系认证']
      },
      rating: 4.8,
      isTop100: true,
    });

    // 创建供应商企业
    const supplierCompany = await this.companyRepository.save({
      name: '绿田化工科技有限公司',
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.ACTIVE,
      profile: {
        description: '专业研发生产高品质农化产品的科技企业',
        address: '江苏省苏州市工业园区创新路168号',
        phone: '0512-87654321',
        website: 'https://lutian-chem.com',
        certificates: ['农药生产许可证', 'GMP认证', '高新技术企业认证']
      },
      rating: 4.9,
      isTop100: true,
    });

    // 创建另一个供应商企业
    const supplierCompany2 = await this.companyRepository.save({
      name: '华农生物科技集团',
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.ACTIVE,
      profile: {
        description: '生物农药和生物肥料领域的领军企业',
        address: '山东省青岛市高新技术开发区科技路99号',
        phone: '0532-98765432',
        website: 'https://huanong-bio.com',
        certificates: ['农药生产许可证', '有机产品认证', '绿色食品生产资料认证']
      },
      rating: 4.7,
      isTop100: false,
    });

    // 创建用户
    const users = [
      // 买家企业用户
      {
        email: 'buyer.owner@yangguang-agri.com',
        password: await bcrypt.hash('User123!', 10),
        name: '李明',
        role: UserRole.OWNER,
        isActive: true,
        companyId: buyerCompany.id,
      },
      {
        email: 'buyer.admin@yangguang-agri.com',
        password: await bcrypt.hash('User123!', 10),
        name: '王芳',
        role: UserRole.ADMIN,
        isActive: true,
        companyId: buyerCompany.id,
      },
      {
        email: 'buyer.member@yangguang-agri.com',
        password: await bcrypt.hash('User123!', 10),
        name: '张伟',
        role: UserRole.MEMBER,
        isActive: true,
        companyId: buyerCompany.id,
      },
      // 供应商企业1用户
      {
        email: 'supplier.owner@lutian-chem.com',
        password: await bcrypt.hash('User123!', 10),
        name: '陈建国',
        role: UserRole.OWNER,
        isActive: true,
        companyId: supplierCompany.id,
      },
      {
        email: 'supplier.admin@lutian-chem.com',
        password: await bcrypt.hash('User123!', 10),
        name: '刘晓燕',
        role: UserRole.ADMIN,
        isActive: true,
        companyId: supplierCompany.id,
      },
      // 供应商企业2用户
      {
        email: 'supplier2.owner@huanong-bio.com',
        password: await bcrypt.hash('User123!', 10),
        name: '赵永强',
        role: UserRole.OWNER,
        isActive: true,
        companyId: supplierCompany2.id,
      },
    ];

    await this.userRepository.save(users);
    this.logger.log('Companies and users seeded successfully');
  }

  async clearAll() {
    this.logger.log('Clearing all seed data...');
    
    await this.userRepository.delete({});
    await this.companyRepository.delete({});
    await this.adminUserRepository.delete({});
    await this.planRepository.delete({});
    
    this.logger.log('All seed data cleared');
  }
}