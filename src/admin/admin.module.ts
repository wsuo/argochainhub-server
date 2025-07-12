import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { Subscription } from '../entities/subscription.entity';
import { Order } from '../entities/order.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Product,
      Inquiry,
      Subscription,
      Order,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}