import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { SampleRequest } from '../entities/sample-request.entity';
import { Subscription } from '../entities/subscription.entity';
import { Order } from '../entities/order.entity';
import { Plan } from '../entities/plan.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VolcTranslateService } from './services/volc-translate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Product,
      Inquiry,
      SampleRequest,
      Subscription,
      Order,
      Plan,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, VolcTranslateService],
  exports: [AdminService, VolcTranslateService],
})
export class AdminModule {}
