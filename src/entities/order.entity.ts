import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { User } from './user.entity';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
@Index(['orderNo'], { unique: true })
export class Order extends BaseEntity {
  @Column({ length: 255, unique: true })
  orderNo: string;

  @Column({ length: 255 })
  planName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ length: 255, nullable: true })
  paymentGatewayTxnId?: string;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  companyId: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', unsigned: true })
  planId: number;

  @ManyToOne(() => Plan, (plan) => plan.orders)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @OneToMany(() => Subscription, (subscription) => subscription.order)
  subscriptions: Subscription[];
}