import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from './subscription.entity';
import { Order } from './order.entity';
import { MultiLangText } from '../types/multilang';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column('json')
  name: MultiLangText;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  durationDays: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('json')
  specs: {
    userAccounts?: number;
    aiQueriesMonthly?: number;
    inquiriesMonthly?: number;
    sampleRequestsMonthly?: number;
    registrationRequestsMonthly?: number;
    productsLimit?: number;
    supportLevel?: string;
  };

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @OneToMany(() => Order, (order) => order.plan)
  orders: Order[];
}
