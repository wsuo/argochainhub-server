import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QUOTA_TYPE_KEY } from '../decorators/quota-type.decorator';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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

    // TODO: 实现配额检查逻辑
    // 这里暂时返回true，稍后在订阅系统中实现具体逻辑
    
    return true;
  }
}