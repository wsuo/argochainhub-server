import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { SampleRequest } from '../entities/sample-request.entity';
import { RegistrationRequest } from '../entities/registration-request.entity';
import { Product } from '../entities/product.entity';
import { QuotaService } from './quota.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Inquiry,
      SampleRequest,
      RegistrationRequest,
      Product,
    ]),
  ],
  providers: [QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}
