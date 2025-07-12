import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminUser } from '../../entities/admin-user.entity';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('admin-roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!(user instanceof AdminUser)) {
      return false;
    }

    // 超级管理员可以访问所有资源
    if (user.role === 'super_admin') {
      return true;
    }

    // 检查普通管理员权限
    return requiredRoles.some((role) => user.role === role);
  }
}