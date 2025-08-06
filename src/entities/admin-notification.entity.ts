import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AdminUser } from './admin-user.entity';
import { AdminPermission } from '../types/permissions';

export enum AdminNotificationType {
  // 审核提醒类
  USER_REGISTRATION_PENDING = 'user_registration_pending',
  COMPANY_REVIEW_PENDING = 'company_review_pending',
  PRODUCT_REVIEW_PENDING = 'product_review_pending',
  SAMPLE_REQUEST_PENDING = 'sample_request_pending',
  REGISTRATION_REQUEST_PENDING = 'registration_request_pending',
  
  // 审核结果类
  COMPANY_APPROVED = 'company_approved',
  COMPANY_REJECTED = 'company_rejected',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  
  // 业务监控类
  INQUIRY_CREATED = 'inquiry_created',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  USER_COMPLAINT = 'user_complaint',
  FEEDBACK_RECEIVED = 'feedback_received',
  BUSINESS_TRANSACTION_SUCCESS = 'business_transaction_success',
  BUSINESS_TRANSACTION_FAILED = 'business_transaction_failed',
  
  // 运营提醒类
  VIP_EXPIRING_BATCH = 'vip_expiring_batch',
  SUBSCRIPTION_METRICS = 'subscription_metrics',
  BUSINESS_METRICS_ALERT = 'business_metrics_alert',
  REVENUE_ALERT = 'revenue_alert',
  
  // 系统告警类
  API_ERROR_RATE_HIGH = 'api_error_rate_high',
  DATABASE_CONNECTION_ERROR = 'database_connection_error',
  SYSTEM_RESOURCE_WARNING = 'system_resource_warning',
  SECURITY_EVENT = 'security_event',
  BACKUP_FAILED = 'backup_failed',
  
  // 系统通知类
  SYSTEM_MAINTENANCE = 'system_maintenance',
  VERSION_UPDATE = 'version_update',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
}

export enum AdminNotificationPriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum AdminNotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export enum AdminNotificationCategory {
  REVIEW = 'review',        // 审核类
  BUSINESS = 'business',    // 业务类
  OPERATION = 'operation',  // 运营类
  SYSTEM = 'system',        // 系统类
  SECURITY = 'security',    // 安全类
}

@Entity('admin_notifications')
@Index(['adminUserId', 'status'])
@Index(['adminUserId', 'createdAt'])
@Index(['priority', 'createdAt'])
@Index(['category', 'createdAt'])
export class AdminNotification extends BaseEntity {
  @Column({
    type: 'enum',
    enum: AdminNotificationType,
  })
  type: AdminNotificationType;

  @Column({ length: 255, comment: '通知标题' })
  title: string;

  @Column('text', { comment: '通知内容' })
  content: string;

  @Column({
    type: 'enum',
    enum: AdminNotificationPriority,
    default: AdminNotificationPriority.NORMAL,
    comment: '通知优先级',
  })
  priority: AdminNotificationPriority;

  @Column({
    type: 'enum',
    enum: AdminNotificationCategory,
    comment: '通知分类',
  })
  category: AdminNotificationCategory;

  @Column({
    type: 'enum',
    enum: AdminNotificationStatus,
    default: AdminNotificationStatus.UNREAD,
  })
  status: AdminNotificationStatus;

  @Column('json', { nullable: true, comment: '附加数据' })
  data?: {
    relatedId?: number;
    relatedType?: string;
    actionUrl?: string;
    requiredPermissions?: AdminPermission[]; // 需要的权限
    targetAdminIds?: number[]; // 指定目标管理员ID
    metrics?: any; // 业务指标数据
    alertLevel?: string; // 告警级别
    [key: string]: any;
  };

  @Column({ type: 'timestamp', nullable: true, comment: '已读时间' })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '归档时间' })
  archivedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '过期时间' })
  expiresAt?: Date;

  // 关联关系
  @Column({ type: 'int', unsigned: true, nullable: true, comment: '目标管理员ID' })
  adminUserId?: number;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminUserId' })
  adminUser?: AdminUser;

  // 如果adminUserId为空，表示这是一个广播通知，所有管理员都会收到
  
  // 辅助方法
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isHighPriority(): boolean {
    return [AdminNotificationPriority.HIGH, AdminNotificationPriority.URGENT, AdminNotificationPriority.CRITICAL].includes(this.priority);
  }

  isCritical(): boolean {
    return this.priority === AdminNotificationPriority.CRITICAL;
  }

  shouldShowToAdmin(admin: AdminUser): boolean {
    // 如果有指定管理员ID，检查是否匹配
    if (this.adminUserId && this.adminUserId !== admin.id) {
      return false;
    }

    // 如果有权限要求，检查管理员是否有相应权限
    if (this.data?.requiredPermissions) {
      return admin.hasAnyPermission(this.data.requiredPermissions);
    }

    // 如果有指定目标管理员列表
    if (this.data?.targetAdminIds) {
      return this.data.targetAdminIds.includes(admin.id);
    }

    // 默认显示给所有管理员（广播通知）
    return true;
  }
}