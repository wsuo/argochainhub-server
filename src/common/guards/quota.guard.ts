import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QUOTA_TYPE_KEY } from '../decorators/quota-type.decorator';
import { QuotaService, QuotaType } from '../../quota/quota.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private quotaService: QuotaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaType = this.reflector.getAllAndOverride<string>(QUOTA_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!quotaType) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.company) {
      throw new ForbiddenException('User or company not found');
    }

    const quotaCheck = await this.quotaService.checkQuota(
      user.companyId,
      quotaType as QuotaType,
    );

    if (!quotaCheck.allowed) {
      throw new ForbiddenException(
        quotaCheck.message || `Quota limit exceeded for ${quotaType}`,
      );
    }

    return true;
  }
}
