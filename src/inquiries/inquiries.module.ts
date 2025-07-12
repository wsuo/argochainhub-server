import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from '../entities/inquiry.entity';
import { InquiryItem } from '../entities/inquiry-item.entity';
import { Product } from '../entities/product.entity';
import { Company } from '../entities/company.entity';
import { CommonModule } from '../common/common.module';
import { QuotaModule } from '../quota/quota.module';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inquiry, InquiryItem, Product, Company]),
    CommonModule,
    QuotaModule,
  ],
  providers: [InquiriesService],
  controllers: [InquiriesController],
  exports: [InquiriesService],
})
export class InquiriesModule {}