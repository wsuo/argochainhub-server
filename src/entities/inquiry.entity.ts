import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { InquiryItem } from './inquiry-item.entity';

export enum InquiryStatus {
  PENDING_QUOTE = 'pending_quote',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('inquiries')
export class Inquiry extends BaseEntity {
  @Column({ length: 255, unique: true })
  inquiryNo: string;

  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING_QUOTE,
  })
  status: InquiryStatus;

  @Column('json')
  details: {
    deliveryLocation?: string;
    tradeTerms?: string;
    paymentMethod?: string;
    buyerRemarks?: string;
    declineReason?: string;
    declinedBy?: string;
  };

  @Column('json', { nullable: true })
  quoteDetails?: {
    totalPrice?: number;
    validUntil?: string;
    supplierRemarks?: string;
  };

  @Column({ type: 'date' })
  deadline: Date;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  buyerId: number;

  @ManyToOne(() => Company, (company) => company.buyerInquiries)
  @JoinColumn({ name: 'buyerId' })
  buyer: Company;

  @Column({ type: 'bigint', unsigned: true })
  supplierId: number;

  @ManyToOne(() => Company, (company) => company.supplierInquiries)
  @JoinColumn({ name: 'supplierId' })
  supplier: Company;

  @OneToMany(() => InquiryItem, (inquiryItem) => inquiryItem.inquiry)
  items: InquiryItem[];
}