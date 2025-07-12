import { Module } from '@nestjs/common';
import { QuotaModule } from '../quota/quota.module';
import { QuotaGuard } from './guards/quota.guard';
import { RolesGuard } from './guards/roles.guard';
import { CompanyTypeGuard } from './guards/company-type.guard';

@Module({
  imports: [QuotaModule],
  providers: [QuotaGuard, RolesGuard, CompanyTypeGuard],
  exports: [QuotaGuard, RolesGuard, CompanyTypeGuard],
})
export class CommonModule {}
