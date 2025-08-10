import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SamplesController } from './samples.controller';
import { SamplesService } from './samples.service';
import { SampleRequest } from '../entities/sample-request.entity';
import { Product } from '../entities/product.entity';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleRequest,
      Product,
      Company,
      User,
      Notification,
    ]),
    NotificationsModule,
  ],
  controllers: [SamplesController],
  providers: [SamplesService],
  exports: [SamplesService],
})
export class SamplesModule {}