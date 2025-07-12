import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { COMPANY_TYPES_KEY } from '../decorators/company-types.decorator';
import { CompanyType } from '../../entities/company.entity';

@Injectable()
export class CompanyTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<CompanyType[]>(COMPANY_TYPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTypes) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.company) {
      throw new ForbiddenException('User or company not found');
    }

    const hasType = requiredTypes.includes(user.company.type);
    
    if (!hasType) {
      throw new ForbiddenException('Company type not authorized for this operation');
    }

    return true;
  }
}