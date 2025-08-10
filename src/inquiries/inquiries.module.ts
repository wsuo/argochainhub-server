import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from '../entities/inquiry.entity';
import { InquiryItem } from '../entities/inquiry-item.entity';
import { Product } from '../entities/product.entity';
import { Company } from '../entities/company.entity';
import { Communication } from '../entities/communication.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { CommonModule } from '../common/common.module';
import { QuotaModule } from '../quota/quota.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { InquiryMessageService } from './inquiry-message.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inquiry, 
      InquiryItem, 
      Product, 
      Company, 
      Communication,
      User,
      Notification
    ]),
    CommonModule,
    QuotaModule,
    NotificationsModule,
  ],
  providers: [InquiriesService, InquiryMessageService],
  controllers: [InquiriesController],
  exports: [InquiriesService, InquiryMessageService],
})
export class InquiriesModule {}
