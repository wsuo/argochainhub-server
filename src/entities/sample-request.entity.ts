import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { Product } from './product.entity';

export enum SampleRequestStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('sample_requests')
export class SampleRequest extends BaseEntity {
  @Column({ length: 255, unique: true })
  sampleReqNo: string;

  @Column('decimal', { precision: 15, scale: 3 })
  quantity: number;

  @Column({ length: 50 })
  unit: string;

  @Column({
    type: 'enum',
    enum: SampleRequestStatus,
    default: SampleRequestStatus.PENDING_APPROVAL,
  })
  status: SampleRequestStatus;

  @Column('json')
  details: {
    purpose?: string;
    shippingAddress?: string;
    shippingMethod?: string;
    willingnessToPay?: {
      paid: boolean;
      amount?: number;
    };
    // 扩展字段
    cancelReason?: string;
    cancelledAt?: string;
    deliveryInfo?: {
      receivedAt?: string;
      condition?: string;
      notes?: string;
      images?: string[];
    };
    approvalInfo?: {
      approvedAt?: string;
      approvedBy?: string;
      notes?: string;
      estimatedShipDate?: string;
    };
    rejectionInfo?: {
      rejectedAt?: string;
      rejectedBy?: string;
      reason?: string;
    };
    shippingInfo?: {
      shippedAt?: string;
      shippedBy?: string;
      notes?: string;
    };
  };

  @Column('json', { nullable: true })
  trackingInfo?: {
    carrier?: string;
    trackingNumber?: string;
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

  @ManyToOne(() => Company, (company) => company.buyerSampleRequests)
  @JoinColumn({ name: 'buyerId' })
  buyer: Company;

  @Column({ type: 'bigint', unsigned: true })
  supplierId: number;

  @ManyToOne(() => Company, (company) => company.supplierSampleRequests)
  @JoinColumn({ name: 'supplierId' })
  supplier: Company;

  @Column({ type: 'bigint', unsigned: true })
  productId: number;

  @ManyToOne(() => Product, (product) => product.sampleRequests)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
