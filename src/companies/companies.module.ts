import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompanyUsersService } from './company-users.service';
import { CompanyUsersController } from './company-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Subscription])],
  providers: [CompaniesService, CompanyUsersService],
  controllers: [CompaniesController, CompanyUsersController],
  exports: [CompaniesService, CompanyUsersService],
})
export class CompaniesModule {}
