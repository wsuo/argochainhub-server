import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';

export interface InquiryCreatedEvent {
  inquiryId: number;
  buyerId: number;
  supplierId: number;
  buyerName: string;
}

export interface InquiryQuotedEvent {
  inquiryId: number;
  buyerId: number;
  supplierId: number;
  supplierName: string;
}

export interface ProductReviewedEvent {
  productId: number;
  supplierId: number;
  productName: string;
  approved: boolean;
  reason?: string;
}

export interface CompanyReviewedEvent {
  companyId: number;
  approved: boolean;
  reason?: string;
}

@Injectable()
export class EventsService {
  constructor(
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
  ) {}

  // 发送事件的方法
  emitInquiryCreated(event: InquiryCreatedEvent): void {
    this.eventEmitter.emit('inquiry.created', event);
  }

  emitInquiryQuoted(event: InquiryQuotedEvent): void {
    this.eventEmitter.emit('inquiry.quoted', event);
  }

  emitProductReviewed(event: ProductReviewedEvent): void {
    this.eventEmitter.emit('product.reviewed', event);
  }

  emitCompanyReviewed(event: CompanyReviewedEvent): void {
    this.eventEmitter.emit('company.reviewed', event);
  }

  // 事件监听器
  @OnEvent('inquiry.created')
  async handleInquiryCreated(event: InquiryCreatedEvent): Promise<void> {
    await this.notificationsService.notifyInquiryCreated(
      event.supplierId,
      event.inquiryId,
      event.buyerName,
    );
  }

  @OnEvent('inquiry.quoted')
  async handleInquiryQuoted(event: InquiryQuotedEvent): Promise<void> {
    await this.notificationsService.notifyInquiryQuoted(
      event.buyerId,
      event.inquiryId,
      event.supplierName,
    );
  }

  @OnEvent('product.reviewed')
  async handleProductReviewed(event: ProductReviewedEvent): Promise<void> {
    if (event.approved) {
      await this.notificationsService.notifyProductApproved(
        event.supplierId,
        event.productId,
        event.productName,
      );
    } else {
      await this.notificationsService.notifyProductRejected(
        event.supplierId,
        event.productId,
        event.productName,
        event.reason,
      );
    }
  }

  @OnEvent('company.reviewed')
  async handleCompanyReviewed(event: CompanyReviewedEvent): Promise<void> {
    if (event.approved) {
      await this.notificationsService.notifyCompanyApproved(event.companyId);
    }
    // 拒绝通知可能通过其他方式处理（如邮件）
  }
}