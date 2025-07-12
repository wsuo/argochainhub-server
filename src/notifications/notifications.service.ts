import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createNotification(
    createDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    return this.notificationRepository.save(notification);
  }

  async createNotificationForUser(
    userId: number,
    type: NotificationType,
    title: string,
    content: string,
    data?: any,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type,
      title,
      content,
      data,
    });
  }

  async createNotificationForCompany(
    companyId: number,
    type: NotificationType,
    title: string,
    content: string,
    data?: any,
  ): Promise<Notification[]> {
    // 获取公司所有用户
    const users = await this.userRepository.find({
      where: { companyId },
    });

    const notifications = users.map(user => 
      this.notificationRepository.create({
        userId: user.id,
        type,
        title,
        content,
        data,
      })
    );

    return this.notificationRepository.save(notifications);
  }

  async getMyNotifications(
    user: User,
    paginationDto: PaginationDto & {
      status?: NotificationStatus;
      type?: NotificationType;
    },
  ): Promise<PaginatedResult<Notification>> {
    const { page = 1, limit = 20, status, type } = paginationDto;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId: user.id });

    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    const [notifications, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('notification.createdAt', 'DESC')
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

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  async markAsRead(user: User, id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(user: User): Promise<void> {
    await this.notificationRepository.update(
      {
        userId: user.id,
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    );
  }

  async deleteNotification(user: User, id: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async updateNotification(
    user: User,
    id: number,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    Object.assign(notification, updateDto);
    return this.notificationRepository.save(notification);
  }

  // 业务通知方法
  async notifyInquiryCreated(
    supplierId: number,
    inquiryId: number,
    buyerName: string,
  ): Promise<void> {
    await this.createNotificationForCompany(
      supplierId,
      NotificationType.INQUIRY_NEW,
      '新的询价单',
      `您收到了来自 ${buyerName} 的新询价单`,
      {
        relatedId: inquiryId,
        relatedType: 'inquiry',
        actionUrl: `/inquiries/${inquiryId}`,
      },
    );
  }

  async notifyInquiryQuoted(
    buyerId: number,
    inquiryId: number,
    supplierName: string,
  ): Promise<void> {
    await this.createNotificationForCompany(
      buyerId,
      NotificationType.INQUIRY_QUOTED,
      '收到报价',
      `${supplierName} 已对您的询价单进行报价`,
      {
        relatedId: inquiryId,
        relatedType: 'inquiry',
        actionUrl: `/inquiries/${inquiryId}`,
      },
    );
  }

  async notifyProductApproved(
    supplierId: number,
    productId: number,
    productName: string,
  ): Promise<void> {
    await this.createNotificationForCompany(
      supplierId,
      NotificationType.PRODUCT_APPROVED,
      '产品审核通过',
      `您的产品 "${productName}" 已通过审核`,
      {
        relatedId: productId,
        relatedType: 'product',
        actionUrl: `/products/${productId}`,
      },
    );
  }

  async notifyProductRejected(
    supplierId: number,
    productId: number,
    productName: string,
    reason?: string,
  ): Promise<void> {
    await this.createNotificationForCompany(
      supplierId,
      NotificationType.PRODUCT_REJECTED,
      '产品审核未通过',
      `您的产品 "${productName}" 审核未通过${reason ? `，原因：${reason}` : ''}`,
      {
        relatedId: productId,
        relatedType: 'product',
        actionUrl: `/products/${productId}`,
      },
    );
  }

  async notifyCompanyApproved(companyId: number): Promise<void> {
    await this.createNotificationForCompany(
      companyId,
      NotificationType.COMPANY_APPROVED,
      '企业认证通过',
      '恭喜！您的企业认证已通过审核，现在可以正常使用平台功能',
      {
        relatedId: companyId,
        relatedType: 'company',
        actionUrl: '/company/profile',
      },
    );
  }

  async notifySubscriptionExpiring(
    companyId: number,
    daysRemaining: number,
  ): Promise<void> {
    await this.createNotificationForCompany(
      companyId,
      NotificationType.SUBSCRIPTION_EXPIRING,
      '会员即将到期',
      `您的会员将在 ${daysRemaining} 天后到期，请及时续费`,
      {
        relatedType: 'subscription',
        actionUrl: '/subscription/renew',
      },
    );
  }
}