import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { 
  AdminNotification, 
  AdminNotificationType, 
  AdminNotificationStatus, 
  AdminNotificationPriority,
  AdminNotificationCategory 
} from '../entities/admin-notification.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { AdminPermission } from '../types/permissions';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { NotificationGateway } from './notification.gateway';

export interface CreateAdminNotificationDto {
  type: AdminNotificationType;
  title: string;
  content: string;
  priority?: AdminNotificationPriority;
  category: AdminNotificationCategory;
  data?: any;
  expiresAt?: Date;
  // 目标管理员配置
  targetAdminId?: number; // 特定管理员
  targetAdminIds?: number[]; // 多个特定管理员
  requiredPermissions?: AdminPermission[]; // 权限要求
  broadcastToAll?: boolean; // 广播给所有管理员
}

@Injectable()
export class AdminNotificationsService {
  constructor(
    @InjectRepository(AdminNotification)
    private readonly adminNotificationRepository: Repository<AdminNotification>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 创建单个管理员通知并实时推送
   */
  async createNotificationForAdmin(
    adminUserId: number,
    type: AdminNotificationType,
    title: string,
    content: string,
    priority: AdminNotificationPriority = AdminNotificationPriority.NORMAL,
    category: AdminNotificationCategory,
    data?: any,
  ): Promise<AdminNotification> {
    const notification = this.adminNotificationRepository.create({
      type,
      title,
      content,
      priority,
      category,
      adminUserId,
      data,
    });

    const savedNotification = await this.adminNotificationRepository.save(notification);

    // 实时推送通知
    await this.notificationGateway.sendNotificationToAdmin(adminUserId, {
      id: savedNotification.id,
      type: savedNotification.type,
      title: savedNotification.title,
      content: savedNotification.content,
      priority: savedNotification.priority,
      category: savedNotification.category,
      data: savedNotification.data,
      createdAt: savedNotification.createdAt,
    });

    return savedNotification;
  }

  /**
   * 基于权限创建通知（权限分发）
   */
  async createNotificationByPermissions(
    requiredPermissions: AdminPermission[],
    type: AdminNotificationType,
    title: string,
    content: string,
    priority: AdminNotificationPriority = AdminNotificationPriority.NORMAL,
    category: AdminNotificationCategory,
    data?: any,
  ): Promise<AdminNotification[]> {
    // 获取有相应权限的管理员
    const admins = await this.adminUserRepository.find({
      where: { isActive: true },
    });

    const eligibleAdmins = admins.filter(admin => 
      admin.hasAnyPermission(requiredPermissions)
    );

    if (eligibleAdmins.length === 0) {
      console.log(`⚠️ 没有管理员具有权限 ${requiredPermissions.join(', ')}，跳过通知创建`);
      return [];
    }

    // 创建通知（包含权限信息用于前端显示）
    const notifications = eligibleAdmins.map(admin => 
      this.adminNotificationRepository.create({
        type,
        title,
        content,
        priority,
        category,
        adminUserId: admin.id,
        data: {
          ...data,
          requiredPermissions,
        },
      })
    );

    const savedNotifications = await this.adminNotificationRepository.save(notifications);

    // 批量实时推送
    for (const notification of savedNotifications) {
      if (notification.adminUserId) {
        await this.notificationGateway.sendNotificationToAdmin(notification.adminUserId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          priority: notification.priority,
          category: notification.category,
          data: notification.data,
          createdAt: notification.createdAt,
        });
      }
    }

    console.log(`📤 向 ${savedNotifications.length} 个管理员推送权限通知: ${title}`);
    return savedNotifications;
  }

  /**
   * 创建广播通知（所有管理员）
   */
  async createBroadcastNotification(
    type: AdminNotificationType,
    title: string,
    content: string,
    priority: AdminNotificationPriority = AdminNotificationPriority.NORMAL,
    category: AdminNotificationCategory,
    data?: any,
  ): Promise<AdminNotification[]> {
    // 获取所有活跃管理员
    const admins = await this.adminUserRepository.find({
      where: { isActive: true },
    });

    const notifications = admins.map(admin => 
      this.adminNotificationRepository.create({
        type,
        title,
        content,
        priority,
        category,
        adminUserId: admin.id,
        data,
      })
    );

    const savedNotifications = await this.adminNotificationRepository.save(notifications);

    // 广播实时推送
    await this.notificationGateway.broadcastToAllAdmins({
      type,
      title,
      content,
      priority,
      category,
      data,
      createdAt: savedNotifications[0]?.createdAt,
    });

    console.log(`📢 向所有管理员广播通知: ${title}`);
    return savedNotifications;
  }

  /**
   * 智能分发通知（根据配置自动选择分发方式）
   */
  async createAndDistributeNotification(config: CreateAdminNotificationDto): Promise<AdminNotification[]> {
    const { 
      type, 
      title, 
      content, 
      priority = AdminNotificationPriority.NORMAL, 
      category, 
      data,
      targetAdminId,
      targetAdminIds,
      requiredPermissions,
      broadcastToAll
    } = config;

    const notifications: AdminNotification[] = [];

    // 1. 特定管理员通知
    if (targetAdminId) {
      const notification = await this.createNotificationForAdmin(
        targetAdminId, type, title, content, priority, category, data
      );
      notifications.push(notification);
      return notifications;
    }

    // 2. 多个特定管理员通知
    if (targetAdminIds && targetAdminIds.length > 0) {
      for (const adminId of targetAdminIds) {
        const notification = await this.createNotificationForAdmin(
          adminId, type, title, content, priority, category, data
        );
        notifications.push(notification);
      }
      return notifications;
    }

    // 3. 基于权限的通知
    if (requiredPermissions && requiredPermissions.length > 0) {
      return this.createNotificationByPermissions(
        requiredPermissions, type, title, content, priority, category, data
      );
    }

    // 4. 广播通知
    if (broadcastToAll) {
      return this.createBroadcastNotification(
        type, title, content, priority, category, data
      );
    }

    throw new Error('Invalid notification distribution configuration');
  }

  /**
   * 获取管理员通知列表（分页）
   */
  async getAdminNotifications(
    adminUser: AdminUser,
    paginationDto: PaginationDto & {
      status?: AdminNotificationStatus;
      priority?: AdminNotificationPriority;
      category?: AdminNotificationCategory;
      type?: AdminNotificationType;
    },
  ): Promise<PaginatedResult<AdminNotification>> {
    const { page = 1, limit = 20, status, priority, category, type } = paginationDto;

    const queryBuilder = this.adminNotificationRepository
      .createQueryBuilder('notification')
      .where('notification.adminUserId = :adminUserId', { adminUserId: adminUser.id });

    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('notification.priority = :priority', { priority });
    }

    if (category) {
      queryBuilder.andWhere('notification.category = :category', { category });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    // 过滤掉过期的通知
    queryBuilder.andWhere(
      '(notification.expiresAt IS NULL OR notification.expiresAt > :now)',
      { now: new Date() }
    );

    const [notifications, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('notification.priority', 'DESC')
      .addOrderBy('notification.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: notifications,
      meta: {
        totalItems: total,
        itemCount: notifications.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * 获取管理员未读通知数量
   */
  async getUnreadCount(adminUserId: number): Promise<number> {
    return this.adminNotificationRepository.count({
      where: {
        adminUserId,
        status: AdminNotificationStatus.UNREAD,
      },
    });
  }

  /**
   * 获取管理员未读通知数量（按优先级分组）
   */
  async getUnreadCountByPriority(adminUserId: number): Promise<Record<AdminNotificationPriority, number>> {
    const counts = await this.adminNotificationRepository
      .createQueryBuilder('notification')
      .select('notification.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('notification.adminUserId = :adminUserId', { adminUserId })
      .andWhere('notification.status = :status', { status: AdminNotificationStatus.UNREAD })
      .andWhere('(notification.expiresAt IS NULL OR notification.expiresAt > :now)', { now: new Date() })
      .groupBy('notification.priority')
      .getRawMany();

    const result = {
      [AdminNotificationPriority.CRITICAL]: 0,
      [AdminNotificationPriority.URGENT]: 0,
      [AdminNotificationPriority.HIGH]: 0,
      [AdminNotificationPriority.NORMAL]: 0,
      [AdminNotificationPriority.LOW]: 0,
    };

    counts.forEach(({ priority, count }) => {
      result[priority] = parseInt(count);
    });

    return result;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(adminUser: AdminUser, id: number): Promise<AdminNotification> {
    const notification = await this.adminNotificationRepository.findOne({
      where: { id, adminUserId: adminUser.id },
    });

    if (!notification) {
      throw new NotFoundException('Admin notification not found');
    }

    notification.status = AdminNotificationStatus.READ;
    notification.readAt = new Date();

    const savedNotification = await this.adminNotificationRepository.save(notification);

    // 推送未读数量更新
    const newUnreadCount = await this.getUnreadCount(adminUser.id);
    await this.notificationGateway.sendNotificationToAdmin(adminUser.id, {
      type: 'unread_count_update',
      count: newUnreadCount,
    });

    return savedNotification;
  }

  /**
   * 批量标记已读
   */
  async markAllAsRead(adminUser: AdminUser): Promise<void> {
    await this.adminNotificationRepository.update(
      { adminUserId: adminUser.id, status: AdminNotificationStatus.UNREAD },
      { status: AdminNotificationStatus.READ, readAt: new Date() }
    );

    // 推送未读数量更新
    await this.notificationGateway.sendNotificationToAdmin(adminUser.id, {
      type: 'unread_count_update',
      count: 0,
    });
  }

  /**
   * 归档通知
   */
  async archiveNotification(adminUser: AdminUser, id: number): Promise<AdminNotification> {
    const notification = await this.adminNotificationRepository.findOne({
      where: { id, adminUserId: adminUser.id },
    });

    if (!notification) {
      throw new NotFoundException('Admin notification not found');
    }

    notification.status = AdminNotificationStatus.ARCHIVED;
    notification.archivedAt = new Date();

    return this.adminNotificationRepository.save(notification);
  }

  /**
   * 删除通知
   */
  async deleteNotification(adminUser: AdminUser, id: number): Promise<void> {
    const result = await this.adminNotificationRepository.delete({
      id,
      adminUserId: adminUser.id,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Admin notification not found');
    }
  }

  /**
   * 清理过期通知
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await this.adminNotificationRepository
      .createQueryBuilder()
      .delete()
      .from(AdminNotification)
      .where('expiresAt IS NOT NULL AND expiresAt <= :now', { now: new Date() })
      .execute();

    console.log(`🗑️ 清理了 ${result.affected} 个过期的管理员通知`);
    return result.affected || 0;
  }

  // 业务通知方法

  /**
   * 发送用户注册审核通知
   */
  async notifyUserRegistrationPending(userId: number, userName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.USER_VIEW],
      AdminNotificationType.USER_REGISTRATION_PENDING,
      '新用户注册待审核',
      `用户 ${userName} 提交了注册申请，请及时审核`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.REVIEW,
      {
        relatedId: userId,
        relatedType: 'user',
        actionUrl: `/admin/users/${userId}`,
      }
    );
  }

  /**
   * 发送企业认证审核通知
   */
  async notifyCompanyReviewPending(companyId: number, companyName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.COMPANY_REVIEW],
      AdminNotificationType.COMPANY_REVIEW_PENDING,
      '企业认证待审核',
      `企业 ${companyName} 提交了认证申请，请及时审核`,
      AdminNotificationPriority.HIGH,
      AdminNotificationCategory.REVIEW,
      {
        relatedId: companyId,
        relatedType: 'company',
        actionUrl: `/admin/companies/${companyId}`,
      }
    );
  }

  /**
   * 发送产品审核通知
   */
  async notifyProductReviewPending(productId: number, productName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.PRODUCT_REVIEW],
      AdminNotificationType.PRODUCT_REVIEW_PENDING,
      '产品审核待处理',
      `产品 ${productName} 提交了审核申请，请及时处理`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.REVIEW,
      {
        relatedId: productId,
        relatedType: 'product',
        actionUrl: `/admin/products/${productId}`,
      }
    );
  }

  /**
   * 发送新询价单通知
   */
  async notifyInquiryCreated(inquiryId: number, buyerName: string, productName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.INQUIRY_VIEW],
      AdminNotificationType.INQUIRY_CREATED,
      '新询价单创建',
      `${buyerName} 对产品 ${productName} 创建了询价单`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: inquiryId,
        relatedType: 'inquiry',
        actionUrl: `/admin/inquiries/${inquiryId}`,
      }
    );
  }

  /**
   * 发送企业审核通过通知
   */
  async notifyCompanyApproved(companyId: number, companyName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.COMPANY_VIEW],
      AdminNotificationType.COMPANY_APPROVED,
      '企业审核已通过',
      `企业 ${companyName} 的认证申请已通过审核`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: companyId,
        relatedType: 'company',
        actionUrl: `/admin/companies/${companyId}`,
      }
    );
  }

  /**
   * 发送企业审核拒绝通知
   */
  async notifyCompanyRejected(companyId: number, companyName: string, reason?: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.COMPANY_VIEW],
      AdminNotificationType.COMPANY_REJECTED,
      '企业审核已拒绝',
      `企业 ${companyName} 的认证申请已被拒绝${reason ? `，原因：${reason}` : ''}`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: companyId,
        relatedType: 'company',
        actionUrl: `/admin/companies/${companyId}`,
        reason: reason,
      }
    );
  }

  /**
   * 发送产品审核通过通知
   */
  async notifyProductApproved(productId: number, productName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.PRODUCT_VIEW],
      AdminNotificationType.PRODUCT_APPROVED,
      '产品审核已通过',
      `产品 ${productName} 的审核申请已通过`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: productId,
        relatedType: 'product',
        actionUrl: `/admin/products/${productId}`,
      }
    );
  }

  /**
   * 发送产品审核拒绝通知
   */
  async notifyProductRejected(productId: number, productName: string, reason?: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.PRODUCT_VIEW],
      AdminNotificationType.PRODUCT_REJECTED,
      '产品审核已拒绝',
      `产品 ${productName} 的审核申请已被拒绝${reason ? `，原因：${reason}` : ''}`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: productId,
        relatedType: 'product',
        actionUrl: `/admin/products/${productId}`,
        reason: reason,
      }
    );
  }

  /**
   * 发送询价单确认通知
   */
  async notifyInquiryConfirmed(inquiryId: number, buyerName: string, productName: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.INQUIRY_VIEW],
      AdminNotificationType.BUSINESS_TRANSACTION_SUCCESS,
      '询价单交易成功',
      `${buyerName} 确认了产品 ${productName} 的报价，交易达成`,
      AdminNotificationPriority.NORMAL,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: inquiryId,
        relatedType: 'inquiry',
        actionUrl: `/admin/inquiries/${inquiryId}`,
      }
    );
  }

  /**
   * 发送询价单拒绝通知
   */
  async notifyInquiryDeclined(inquiryId: number, buyerName: string, productName: string, reason?: string): Promise<AdminNotification[]> {
    return this.createNotificationByPermissions(
      [AdminPermission.INQUIRY_VIEW],
      AdminNotificationType.BUSINESS_TRANSACTION_FAILED,
      '询价单被拒绝',
      `${buyerName} 对产品 ${productName} 的询价被拒绝${reason ? `，原因：${reason}` : ''}`,
      AdminNotificationPriority.LOW,
      AdminNotificationCategory.BUSINESS,
      {
        relatedId: inquiryId,
        relatedType: 'inquiry',
        actionUrl: `/admin/inquiries/${inquiryId}`,
        reason: reason,
      }
    );
  }

  /**
   * 发送系统告警通知
   */
  async notifySystemAlert(alertType: string, message: string, level: 'warning' | 'error' | 'critical' = 'warning'): Promise<AdminNotification[]> {
    const priority = level === 'critical' ? AdminNotificationPriority.CRITICAL :
                    level === 'error' ? AdminNotificationPriority.URGENT :
                    AdminNotificationPriority.HIGH;

    return this.createBroadcastNotification(
      AdminNotificationType.SYSTEM_RESOURCE_WARNING,
      `系统告警：${alertType}`,
      message,
      priority,
      AdminNotificationCategory.SYSTEM,
      {
        alertType,
        alertLevel: level,
        timestamp: new Date(),
      }
    );
  }
}