import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../entities/admin-user.entity';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';
import { Product } from '../entities/product.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { InquiryItem } from '../entities/inquiry-item.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser, Company, User, Plan, Product, Inquiry, InquiryItem]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
