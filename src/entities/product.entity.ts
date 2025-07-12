import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { InquiryItem } from './inquiry-item.entity';
import { SampleRequest } from './sample-request.entity';
import { RegistrationRequest } from './registration-request.entity';
import { MultiLangText } from '../types/multilang';

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product extends BaseEntity {
  @Column('json')
  name: MultiLangText;

  @Column('json')
  category: MultiLangText;

  @Column({ length: 255, nullable: true })
  casNo?: string;

  @Column({ length: 255 })
  formulation: string;

  @Column('json')
  activeIngredient: MultiLangText;

  @Column({ length: 255 })
  content: string;

  @Column('json', { nullable: true })
  description?: MultiLangText;

  @Column('json', { nullable: true })
  details?: {
    toxicity?: string;
    physicalProperties?: object;
    packagingSpecs?: string[];
    storageConditions?: string;
    shelfLife?: string;
  };

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  supplierId: number;

  @ManyToOne(() => Company, (company) => company.products)
  @JoinColumn({ name: 'supplierId' })
  supplier: Company;

  @OneToMany(() => InquiryItem, (inquiryItem) => inquiryItem.product)
  inquiryItems: InquiryItem[];

  @OneToMany(() => SampleRequest, (sampleRequest) => sampleRequest.product)
  sampleRequests: SampleRequest[];

  @OneToMany(() => RegistrationRequest, (regRequest) => regRequest.product)
  registrationRequests: RegistrationRequest[];
}