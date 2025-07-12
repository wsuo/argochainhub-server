import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { Plan } from './plan.entity';
import { Order } from './order.entity';

export enum SubscriptionType {
  TRIAL = 'trial',
  PAID = 'paid',
  GIFT = 'gift',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
  })
  type: SubscriptionType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.subscriptions)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'int', unsigned: true })
  planId: number;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  orderId?: number;

  @ManyToOne(() => Order, (order) => order.subscriptions, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order?: Order;
}
