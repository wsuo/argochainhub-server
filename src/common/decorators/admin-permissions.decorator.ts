import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '../../types/permissions';

/**
 * 管理员权限装饰器
 * 用于设置访问控制器或方法所需的权限
 * 
 * @param permissions 需要的权限列表
 * @returns 装饰器函数
 * 
 * @example
 * // 单个权限
 * @AdminPermissions(AdminPermission.COMPANY_VIEW)
 * getCompanies() {}
 * 
 * // 多个权限（任一满足）
 * @AdminPermissions(AdminPermission.COMPANY_CREATE, AdminPermission.COMPANY_UPDATE)
 * manageCompany() {}
 */
export const AdminPermissions = (...permissions: AdminPermission[]) =>
  SetMetadata('admin-permissions', permissions);

/**
 * 管理员权限装饰器（要求所有权限）
 * 用于设置访问控制器或方法所需的所有权限
 * 
 * @param permissions 需要的权限列表（必须全部拥有）
 * @returns 装饰器函数
 * 
 * @example
 * @AdminPermissionsAll(AdminPermission.COMPANY_VIEW, AdminPermission.COMPANY_UPDATE)
 * updateCompanyDetails() {}
 */
export const AdminPermissionsAll = (...permissions: AdminPermission[]) =>
  SetMetadata('admin-permissions-all', permissions);

/**
 * 权限检查模式枚举
 */
export enum PermissionCheckMode {
  ANY = 'any',   // 拥有任一权限即可
  ALL = 'all',   // 必须拥有所有权限
}

/**
 * 高级权限装饰器
 * 提供更灵活的权限控制选项
 * 
 * @param options 权限选项
 * @returns 装饰器函数
 * 
 * @example
 * @AdminPermissionsAdvanced({
 *   permissions: [AdminPermission.COMPANY_VIEW, AdminPermission.COMPANY_CREATE],
 *   mode: PermissionCheckMode.ANY,
 *   allowSuperAdmin: true
 * })
 * manageCompany() {}
 */
export const AdminPermissionsAdvanced = (options: {
  permissions: AdminPermission[];
  mode?: PermissionCheckMode;
  allowSuperAdmin?: boolean;
}) => {
  const metadata = {
    permissions: options.permissions,
    mode: options.mode || PermissionCheckMode.ANY,
    allowSuperAdmin: options.allowSuperAdmin !== false, // 默认允许超级管理员
  };
  return SetMetadata('admin-permissions-advanced', metadata);
};