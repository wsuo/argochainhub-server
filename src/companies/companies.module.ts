import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { SupplierFavorite } from '../entities/supplier-favorite.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompanyUsersService } from './company-users.service';
import { CompanyUsersController } from './company-users.controller';
import { SupplierFavoritesService } from './supplier-favorites.service';
import { SupplierFavoritesController } from './supplier-favorites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Subscription, SupplierFavorite])],
  providers: [CompaniesService, CompanyUsersService, SupplierFavoritesService],
  controllers: [CompaniesController, CompanyUsersController, SupplierFavoritesController],
  exports: [CompaniesService, CompanyUsersService, SupplierFavoritesService],
})
export class CompaniesModule {}
