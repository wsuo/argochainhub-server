import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationRequestsController } from './registration-requests.controller';
import { RegistrationRequestsService } from './registration-requests.service';
import { RegistrationRequest } from '../entities/registration-request.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { Product } from '../entities/product.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationRequest,
      User,
      Company,
      Product,
    ]),
    NotificationsModule,
  ],
  controllers: [RegistrationRequestsController],
  providers: [RegistrationRequestsService],
  exports: [RegistrationRequestsService],
})
export class RegistrationRequestsModule {}