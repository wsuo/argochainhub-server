import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Subscription } from './subscription.entity';
import { Inquiry } from './inquiry.entity';
import { SampleRequest } from './sample-request.entity';
import { RegistrationRequest } from './registration-request.entity';
import { CartItem } from './cart-item.entity';
import { MultiLangText } from '../types/multilang';

export enum CompanyType {
  BUYER = 'buyer',
  SUPPLIER = 'supplier',
}

export enum CompanyStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum CompanySize {
  STARTUP = 'startup',          // 初创企业 (1-10人)
  SMALL = 'small',              // 小型企业 (11-50人)
  MEDIUM = 'medium',            // 中型企业 (51-200人)
  LARGE = 'large',              // 大型企业 (201-1000人)
  ENTERPRISE = 'enterprise',    // 大型集团 (1000+人)
}

@Entity('companies')
export class Company extends BaseEntity {
  @Column('json')
  name: MultiLangText;

  @Column({
    type: 'enum',
    enum: CompanyType,
  })
  type: CompanyType;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING_REVIEW,
  })
  status: CompanyStatus;

  // 基础档案信息
  @Column('json', { nullable: true })
  profile?: {
    description?: MultiLangText;
    address?: string;
    phone?: string;
    website?: string;
    certificates?: string[];
  };

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ default: false })
  isTop100: boolean;

  // 新增详细信息字段
  @Column({ type: 'varchar', length: 100, nullable: true, comment: '企业邮箱' })
  email?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: '国家代码' })
  country?: string;

  @Column('json', { nullable: true, comment: '业务类别（多个）' })
  businessCategories?: string[];

  @Column('json', { nullable: true, comment: '业务范围描述' })
  businessScope?: MultiLangText;

  @Column({ 
    type: 'enum', 
    enum: CompanySize, 
    nullable: true, 
    comment: '公司规模' 
  })
  companySize?: CompanySize;

  @Column('json', { nullable: true, comment: '主要产品/采购产品' })
  mainProducts?: MultiLangText;

  @Column('json', { nullable: true, comment: '主要供应商（采购商填写）' })
  mainSuppliers?: MultiLangText;

  @Column('decimal', { 
    precision: 15, 
    scale: 2, 
    nullable: true, 
    comment: '年进口/出口额（美元）' 
  })
  annualImportExportValue?: number;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    comment: '注册证号' 
  })
  registrationNumber?: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    comment: '税号' 
  })
  taxNumber?: string;

  @Column({ 
    type: 'varchar', 
    length: 500, 
    nullable: true, 
    comment: '营业执照图片地址' 
  })
  businessLicenseUrl?: string;

  @Column('json', { nullable: true, comment: '公司照片地址列表' })
  companyPhotosUrls?: string[];

  // 关联关系
  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Product, (product) => product.supplier)
  products: Product[];

  @OneToMany(() => Subscription, (subscription) => subscription.company)
  subscriptions: Subscription[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.buyer)
  buyerInquiries: Inquiry[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.supplier)
  supplierInquiries: Inquiry[];

  @OneToMany(() => SampleRequest, (sampleRequest) => sampleRequest.buyer)
  buyerSampleRequests: SampleRequest[];

  @OneToMany(() => SampleRequest, (sampleRequest) => sampleRequest.supplier)
  supplierSampleRequests: SampleRequest[];

  @OneToMany(() => RegistrationRequest, (regRequest) => regRequest.buyer)
  buyerRegistrationRequests: RegistrationRequest[];

  @OneToMany(() => RegistrationRequest, (regRequest) => regRequest.supplier)
  supplierRegistrationRequests: RegistrationRequest[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.supplier)
  cartItems: CartItem[];
}
