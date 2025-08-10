import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationGateway } from '../notifications/notification.gateway';
import { Communication } from '../entities/communication.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { Notification, NotificationType } from '../entities/notification.entity';

interface InquiryMessageEvent {
  inquiryId: number;
  messageId: number;
  senderId: number;
  senderName: string;
  senderCompany: string;
  senderCompanyType: string;
  message: string;
  timestamp: string;
  inquiryNo: string;
}

interface InquiryStatusUpdateEvent {
  inquiryId: number;
  inquiryNo: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  updatedBy: {
    userId: number;
    userName: string;
    companyName: string;
    companyType: string;
  };
}

@Injectable()
export class InquiryMessageService {
  constructor(
    @InjectRepository(Communication)
    private readonly communicationRepository: Repository<Communication>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 推送询价消息给相关企业
   */
  async pushInquiryMessage(
    communication: Communication,
    inquiry: Inquiry,
    sender: User,
  ): Promise<void> {
    try {
      // 构建消息事件数据
      const messageEvent: InquiryMessageEvent = {
        inquiryId: inquiry.id,
        messageId: communication.id,
        senderId: sender.id,
        senderName: sender.name || sender.email,
        senderCompany: sender.company?.name ? 
          (typeof sender.company.name === 'string' ? sender.company.name : sender.company.name['zh-CN'] || sender.company.name['en']) : 
          '未知企业',
        senderCompanyType: sender.company?.type || 'unknown',
        message: communication.message,
        timestamp: communication.createdAt.toISOString(),
        inquiryNo: inquiry.inquiryNo,
      };

      // 确定接收方企业ID
      const receiverCompanyId = sender.companyId === inquiry.buyerId ? inquiry.supplierId : inquiry.buyerId;

      // 获取接收方企业的所有用户，为他们创建通知记录
      const receiverUsers = await this.userRepository.find({
        where: { 
          companyId: receiverCompanyId,
          isActive: true 
        }
      });

      // 为接收方企业的每个用户创建通知记录
      const notifications = receiverUsers.map(user => {
        const isBuyerSending = sender.company?.type === 'buyer';
        const notificationType = isBuyerSending ? NotificationType.INQUIRY_NEW : NotificationType.INQUIRY_QUOTED;
        
        return this.notificationRepository.create({
          type: notificationType,
          title: `${messageEvent.senderCompany} 发来新消息`,
          content: messageEvent.message.length > 100 
            ? messageEvent.message.substring(0, 100) + '...' 
            : messageEvent.message,
          userId: user.id,
          data: {
            relatedId: inquiry.id,
            relatedType: 'inquiry',
            messageId: communication.id,
            inquiryNo: inquiry.inquiryNo,
            senderCompanyId: sender.companyId,
            senderCompanyName: messageEvent.senderCompany,
            actionUrl: `/inquiries/${inquiry.id}/messages`
          }
        });
      });

      // 批量保存通知
      if (notifications.length > 0) {
        await this.notificationRepository.save(notifications);
        console.log(`📧 为企业${receiverCompanyId}的${notifications.length}个用户创建了询价消息通知`);
      }

      // 推送WebSocket消息给接收方企业
      await this.notificationGateway.sendInquiryMessageToCompany(receiverCompanyId, messageEvent);

      // 同时为每个在线用户推送通知
      for (const user of receiverUsers) {
        const notification = notifications.find(n => n.userId === user.id);
        if (notification) {
          await this.notificationGateway.sendNotificationToUser(user.id, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            data: notification.data,
            createdAt: notification.createdAt
          });
        }
      }

      console.log(`✅ 询价消息推送成功: 从企业${sender.companyId}推送到企业${receiverCompanyId}, 询价单${inquiry.inquiryNo}`);
    } catch (error) {
      console.error('❌ 询价消息推送失败:', error);
    }
  }

  /**
   * 推送询价状态更新给相关企业
   */
  async pushInquiryStatusUpdate(
    inquiry: Inquiry,
    oldStatus: string,
    updatedBy: User,
  ): Promise<void> {
    try {
      // 构建状态更新事件数据
      const statusEvent: InquiryStatusUpdateEvent = {
        inquiryId: inquiry.id,
        inquiryNo: inquiry.inquiryNo,
        oldStatus,
        newStatus: inquiry.status,
        timestamp: inquiry.updatedAt.toISOString(),
        updatedBy: {
          userId: updatedBy.id,
          userName: updatedBy.name || updatedBy.email,
          companyName: updatedBy.company?.name ? 
            (typeof updatedBy.company.name === 'string' ? updatedBy.company.name : updatedBy.company.name['zh-CN'] || updatedBy.company.name['en']) : 
            '未知企业',
          companyType: updatedBy.company?.type || 'unknown',
        },
      };

      // 推送给买方和供应商（除了操作者自己的企业）
      const targetCompanyIds = [inquiry.buyerId, inquiry.supplierId].filter(
        companyId => companyId !== updatedBy.companyId
      );

      for (const companyId of targetCompanyIds) {
        await this.notificationGateway.sendInquiryStatusUpdateToCompany(companyId, statusEvent);
      }

      console.log(`✅ 询价状态更新推送成功: 询价单${inquiry.inquiryNo}, ${oldStatus} -> ${inquiry.status}`);
    } catch (error) {
      console.error('❌ 询价状态更新推送失败:', error);
    }
  }

  /**
   * 检查企业是否在线
   */
  isCompanyOnline(companyId: number): boolean {
    return this.notificationGateway.isCompanyOnline(companyId);
  }

  /**
   * 获取在线统计信息
   */
  getOnlineStats() {
    return {
      ...this.notificationGateway.getOnlineStats(),
      onlineCompanies: this.notificationGateway.getOnlineCompanyCount(),
    };
  }
}