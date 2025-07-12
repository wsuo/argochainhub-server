import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum NotificationType {
  SYSTEM = 'system',
  INQUIRY_NEW = 'inquiry_new',
  INQUIRY_QUOTED = 'inquiry_quoted', 
  INQUIRY_CONFIRMED = 'inquiry_confirmed',
  INQUIRY_DECLINED = 'inquiry_declined',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  COMPANY_APPROVED = 'company_approved',
  COMPANY_REJECTED = 'company_rejected',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  QUOTA_WARNING = 'quota_warning',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
export class Notification extends BaseEntity {
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column('json', { nullable: true })
  data?: {
    relatedId?: number;
    relatedType?: string;
    actionUrl?: string;
    [key: string]: any;
  };

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}