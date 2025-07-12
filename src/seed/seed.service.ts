import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from '../entities/admin-user.entity';
import {
  Company,
  CompanyType,
  CompanyStatus,
} from '../entities/company.entity';
import { User, UserRole } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { createMultiLangText } from '../types/multilang';

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
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async seedAll() {
    this.logger.log('Starting database seeding...');

    await this.seedAdminUsers();
    await this.seedPlans();
    await this.seedCompaniesAndUsers();
    await this.seedProducts();

    this.logger.log('Database seeding completed');
  }

  private async seedAdminUsers() {
    this.logger.log('Seeding admin users...');

    const existingAdmin = await this.adminUserRepository.findOne({
      where: { username: 'superadmin' },
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
      },
    ];

    await this.adminUserRepository.save(adminUsers);
    this.logger.log('Admin users seeded successfully');
  }

  private async seedPlans() {
    this.logger.log('Seeding subscription plans...');

    const existingPlan = await this.planRepository
      .createQueryBuilder('plan')
      .where(
        'JSON_UNQUOTE(JSON_EXTRACT(plan.name, \'$."zh-CN"\')) = :planName',
        { planName: '基础版' },
      )
      .getOne();

    if (existingPlan) {
      this.logger.log('Plans already exist, skipping...');
      return;
    }

    const plans = [
      {
        name: createMultiLangText('基础版', 'Basic Plan', 'Plan Básico'),
        price: 99.0,
        durationDays: 30,
        specs: {
          userAccounts: 3,
          aiQueriesMonthly: 100,
          inquiriesMonthly: 20,
          sampleRequestsMonthly: 5,
          registrationRequestsMonthly: 3,
          productsLimit: 10,
          supportLevel: 'basic',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: createMultiLangText(
          '专业版',
          'Professional Plan',
          'Plan Profesional',
        ),
        price: 299.0,
        durationDays: 30,
        specs: {
          userAccounts: 10,
          aiQueriesMonthly: 500,
          inquiriesMonthly: 100,
          sampleRequestsMonthly: 20,
          registrationRequestsMonthly: 10,
          productsLimit: 50,
          supportLevel: 'professional',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: createMultiLangText(
          '企业版',
          'Enterprise Plan',
          'Plan Empresarial',
        ),
        price: 999.0,
        durationDays: 30,
        specs: {
          userAccounts: 50,
          aiQueriesMonthly: 2000,
          inquiriesMonthly: 500,
          sampleRequestsMonthly: 100,
          registrationRequestsMonthly: 50,
          productsLimit: 200,
          supportLevel: 'enterprise',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await this.planRepository.save(plans);
    this.logger.log('Subscription plans seeded successfully');
  }

  private async seedCompaniesAndUsers() {
    this.logger.log('Seeding companies and users...');

    const existingBuyer = await this.companyRepository
      .createQueryBuilder('company')
      .where(
        'JSON_UNQUOTE(JSON_EXTRACT(company.name, \'$."zh-CN"\')) = :companyName',
        { companyName: '阳光农业采购有限公司' },
      )
      .getOne();

    if (existingBuyer) {
      this.logger.log('Companies already exist, skipping...');
      return;
    }

    // 创建买家企业
    const buyerCompany = await this.companyRepository.save({
      name: createMultiLangText(
        '阳光农业采购有限公司',
        'Sunshine Agricultural Procurement Co., Ltd.',
        'Sunshine Adquisiciones Agrícolas S.L.',
      ),
      type: CompanyType.BUYER,
      status: CompanyStatus.ACTIVE,
      profile: {
        description: createMultiLangText(
          '专业从事农化产品采购的大型企业',
          'Large enterprise specializing in agrochemical procurement',
          'Gran empresa especializada en adquisiciones agroquímicas',
        ),
        address: '北京市朝阳区农业科技园区88号',
        phone: '010-12345678',
        website: 'https://yangguang-agri.com',
        certificates: ['农药经营许可证', 'ISO9001质量管理体系认证'],
      },
      rating: 4.8,
      isTop100: true,
    });

    // 创建供应商企业
    const supplierCompany = await this.companyRepository.save({
      name: createMultiLangText(
        '绿田化工科技有限公司',
        'GreenField Chemical Technology Co., Ltd.',
        'GreenField Tecnología Química S.L.',
      ),
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.ACTIVE,
      profile: {
        description: createMultiLangText(
          '专业研发生产高品质农化产品的科技企业',
          'Technology enterprise specializing in R&D and production of high-quality agrochemicals',
          'Empresa tecnológica especializada en I+D y producción de agroquímicos de alta calidad',
        ),
        address: '江苏省苏州市工业园区创新路168号',
        phone: '0512-87654321',
        website: 'https://lutian-chem.com',
        certificates: ['农药生产许可证', 'GMP认证', '高新技术企业认证'],
      },
      rating: 4.9,
      isTop100: true,
    });

    // 创建另一个供应商企业
    const supplierCompany2 = await this.companyRepository.save({
      name: createMultiLangText(
        '华农生物科技集团',
        'HuaNong Biotechnology Group',
        'Grupo Biotecnológico HuaNong',
      ),
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.ACTIVE,
      profile: {
        description: createMultiLangText(
          '生物农药和生物肥料领域的领军企业',
          'Leading enterprise in the field of biopesticides and biofertilizers',
          'Empresa líder en el campo de biopesticidas y biofertilizantes',
        ),
        address: '山东省青岛市高新技术开发区科技路99号',
        phone: '0532-98765432',
        website: 'https://huanong-bio.com',
        certificates: [
          '农药生产许可证',
          '有机产品认证',
          '绿色食品生产资料认证',
        ],
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

  private async seedProducts() {
    this.logger.log('Seeding products...');

    const existingProduct = await this.productRepository.findOne({
      where: { casNo: '1071-83-6' },
    });

    if (existingProduct) {
      this.logger.log('Products already exist, skipping...');
      return;
    }

    // 获取供应商企业
    const supplierCompany = await this.companyRepository.findOne({
      where: { type: CompanyType.SUPPLIER },
    });

    if (!supplierCompany) {
      this.logger.error('No supplier company found, cannot seed products');
      return;
    }

    const products = [
      {
        name: createMultiLangText(
          '草甘膦原药',
          'Glyphosate Technical',
          'Glifosato Técnico',
        ),
        category: createMultiLangText('除草剂', 'Herbicide', 'Herbicida'),
        casNo: '1071-83-6',
        formulation: '95%原药',
        activeIngredient: createMultiLangText(
          '草甘膦',
          'Glyphosate',
          'Glifosato',
        ),
        content: '95%',
        description: createMultiLangText(
          '高效除草剂，广谱杀草效果好',
          'High-efficiency herbicide with broad-spectrum weed control',
          'Herbicida de alta eficiencia con control de malezas de amplio espectro',
        ),
        status: ProductStatus.ACTIVE,
        supplierId: supplierCompany.id,
      },
      {
        name: createMultiLangText(
          '吡虫啉原药',
          'Imidacloprid Technical',
          'Imidacloprid Técnico',
        ),
        category: createMultiLangText('杀虫剂', 'Insecticide', 'Insecticida'),
        casNo: '138261-41-3',
        formulation: '97%原药',
        activeIngredient: createMultiLangText(
          '吡虫啉',
          'Imidacloprid',
          'Imidacloprid',
        ),
        content: '97%',
        description: createMultiLangText(
          '新型烟碱类杀虫剂，对刺吸式口器害虫具有优异的防治效果',
          'Novel neonicotinoid insecticide with excellent control of sucking insects',
          'Insecticida neonicotinoide novedoso con excelente control de insectos chupadores',
        ),
        status: ProductStatus.ACTIVE,
        supplierId: supplierCompany.id,
      },
      {
        name: createMultiLangText(
          '多菌灵原药',
          'Carbendazim Technical',
          'Carbendazim Técnico',
        ),
        category: createMultiLangText('杀菌剂', 'Fungicide', 'Fungicida'),
        casNo: '10605-21-7',
        formulation: '98%原药',
        activeIngredient: createMultiLangText(
          '多菌灵',
          'Carbendazim',
          'Carbendazim',
        ),
        content: '98%',
        description: createMultiLangText(
          '广谱内吸性杀菌剂，对多种真菌病害有良好的防治效果',
          'Broad-spectrum systemic fungicide with good control of various fungal diseases',
          'Fungicida sistémico de amplio espectro con buen control de varias enfermedades fúngicas',
        ),
        status: ProductStatus.ACTIVE,
        supplierId: supplierCompany.id,
      },
    ];

    await this.productRepository.save(products);
    this.logger.log('Products seeded successfully');
  }

  async clearAll() {
    this.logger.log('Clearing all seed data...');

    // 先清理有外键约束的表
    await this.productRepository.query('DELETE FROM products');
    await this.userRepository.query('DELETE FROM users');
    await this.companyRepository.query('DELETE FROM companies');
    await this.adminUserRepository.query('DELETE FROM admin_users');
    await this.planRepository.query('DELETE FROM plans');

    // 重置自增ID
    await this.productRepository.query(
      'ALTER TABLE products AUTO_INCREMENT = 1',
    );
    await this.userRepository.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await this.companyRepository.query(
      'ALTER TABLE companies AUTO_INCREMENT = 1',
    );
    await this.adminUserRepository.query(
      'ALTER TABLE admin_users AUTO_INCREMENT = 1',
    );
    await this.planRepository.query('ALTER TABLE plans AUTO_INCREMENT = 1');

    this.logger.log('All seed data cleared');
  }
}
