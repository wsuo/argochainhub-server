import { SetMetadata } from '@nestjs/common';
import { CompanyType } from '../../entities/company.entity';

export const COMPANY_TYPES_KEY = 'companyTypes';
export const CompanyTypes = (...types: CompanyType[]) => SetMetadata(COMPANY_TYPES_KEY, types);