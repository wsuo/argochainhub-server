import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { Product } from './product.entity';

export enum RegistrationRequestStatus {
  PENDING_RESPONSE = 'pending_response',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

@Entity('registration_requests')
export class RegistrationRequest extends BaseEntity {
  @Column({ length: 255, unique: true })
  regReqNo: string;

  @Column({
    type: 'enum',
    enum: RegistrationRequestStatus,
    default: RegistrationRequestStatus.PENDING_RESPONSE,
  })
  status: RegistrationRequestStatus;

  @Column('json')
  details: {
    targetCountry?: string;
    isExclusive?: boolean;
    docReqs?: string[];
    sampleReq?: {
      needed: boolean;
      quantity?: number;
      unit?: string;
    };
    timeline?: string;
    budget?: {
      amount?: number;
      currency?: string;
    };
    additionalRequirements?: string;
    rejectReason?: string;
    progressNote?: string;
    estimatedCompletionDate?: string;
    lastUpdateTime?: string;
  };

  @Column('json')
  productSnapshot: {
    name: string;
    category: string;
    formulation: string;
    activeIngredient: string;
    content: string;
  };

  @Column({ type: 'date' })
  deadline: Date;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  buyerId: number;

  @ManyToOne(() => Company, (company) => company.buyerRegistrationRequests)
  @JoinColumn({ name: 'buyerId' })
  buyer: Company;

  @Column({ type: 'bigint', unsigned: true })
  supplierId: number;

  @ManyToOne(() => Company, (company) => company.supplierRegistrationRequests)
  @JoinColumn({ name: 'supplierId' })
  supplier: Company;

  @Column({ type: 'bigint', unsigned: true })
  productId: number;

  @ManyToOne(() => Product, (product) => product.registrationRequests)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
