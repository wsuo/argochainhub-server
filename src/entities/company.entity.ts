import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Subscription } from './subscription.entity';
import { Inquiry } from './inquiry.entity';
import { SampleRequest } from './sample-request.entity';
import { RegistrationRequest } from './registration-request.entity';
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
}