import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminUser } from '../../entities/admin-user.entity';
import { AdminPermission } from '../../types/permissions';
import { PermissionCheckMode } from '../decorators/admin-permissions.decorator';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(AdminPermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查高级权限配置
    const advancedConfig = this.reflector.getAllAndOverride<{
      permissions: AdminPermission[];
      mode: PermissionCheckMode;
      allowSuperAdmin: boolean;
    }>('admin-permissions-advanced', [context.getHandler(), context.getClass()]);

    if (advancedConfig) {
      return this.checkAdvancedPermissions(context, advancedConfig);
    }

    // 检查所有权限要求
    const allPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
      'admin-permissions-all',
      [context.getHandler(), context.getClass()],
    );

    if (allPermissions) {
      return this.checkAllPermissions(context, allPermissions);
    }

    // 检查任一权限要求
    const anyPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
      'admin-permissions',
      [context.getHandler(), context.getClass()],
    );

    if (anyPermissions) {
      return this.checkAnyPermissions(context, anyPermissions);
    }

    // 如果没有权限要求，允许访问
    return true;
  }

  /**
   * 检查高级权限配置
   */
  private checkAdvancedPermissions(
    context: ExecutionContext,
    config: {
      permissions: AdminPermission[];
      mode: PermissionCheckMode;
      allowSuperAdmin: boolean;
    },
  ): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!(user instanceof AdminUser)) {
      this.logger.warn('非管理员用户尝试访问需要权限的资源');
      return false;
    }

    // 检查超级管理员权限
    if (config.allowSuperAdmin && user.role === 'super_admin') {
      return true;
    }

    // 根据模式检查权限
    if (config.mode === PermissionCheckMode.ALL) {
      return user.hasAllPermissions(config.permissions);
    } else {
      return user.hasAnyPermission(config.permissions);
    }
  }

  /**
   * 检查所有权限要求
   */
  private checkAllPermissions(context: ExecutionContext, requiredPermissions: AdminPermission[]): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!(user instanceof AdminUser)) {
      this.logger.warn('非管理员用户尝试访问需要权限的资源');
      return false;
    }

    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') {
      return true;
    }

    const hasPermissions = user.hasAllPermissions(requiredPermissions);
    
    if (!hasPermissions) {
      this.logger.warn(
        `用户 ${user.username} 缺少必需权限: ${requiredPermissions.join(', ')}`,
      );
    }

    return hasPermissions;
  }

  /**
   * 检查任一权限要求
   */
  private checkAnyPermissions(context: ExecutionContext, requiredPermissions: AdminPermission[]): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!(user instanceof AdminUser)) {
      this.logger.warn('非管理员用户尝试访问需要权限的资源');
      return false;
    }

    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') {
      return true;
    }

    const hasPermissions = user.hasAnyPermission(requiredPermissions);
    
    if (!hasPermissions) {
      this.logger.warn(
        `用户 ${user.username} 缺少任一必需权限: ${requiredPermissions.join(', ')}`,
      );
    }

    return hasPermissions;
  }
}

/**
 * 兼容性守卫，继续支持旧的角色检查方式
 * 同时支持新的权限检查
 */
@Injectable()
export class AdminRolesAndPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(AdminRolesAndPermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 优先检查权限
    const permissionsGuard = new AdminPermissionsGuard(this.reflector);
    const hasPermissions = permissionsGuard.canActivate(context);
    
    // 如果权限检查有明确结果，使用权限检查结果
    const hasPermissionMetadata = this.hasPermissionMetadata(context);
    if (hasPermissionMetadata) {
      return hasPermissions;
    }

    // 回退到角色检查
    return this.checkRoles(context);
  }

  /**
   * 检查是否有权限相关的元数据
   */
  private hasPermissionMetadata(context: ExecutionContext): boolean {
    const advancedConfig = this.reflector.getAllAndOverride('admin-permissions-advanced', [
      context.getHandler(),
      context.getClass(),
    ]);
    const allPermissions = this.reflector.getAllAndOverride('admin-permissions-all', [
      context.getHandler(),
      context.getClass(),
    ]);
    const anyPermissions = this.reflector.getAllAndOverride('admin-permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    return !!(advancedConfig || allPermissions || anyPermissions);
  }

  /**
   * 传统角色检查
   */
  private checkRoles(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'admin-roles',
      [context.getHandler(), context.getClass()],
    );

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