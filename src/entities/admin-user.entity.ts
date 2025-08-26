import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AdminPermission, AdminRole, DEFAULT_ROLE_PERMISSIONS } from '../types/permissions';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, unique: true })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255 })
  role: AdminRole;

  @Column('json', { nullable: true, comment: '用户具体权限列表' })
  permissions?: AdminPermission[];

  @Column({ default: false, comment: '是否为系统内置用户' })
  isSystemUser: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  // 关联关系
  @OneToMany(() => AuditLog, (auditLog) => auditLog.adminUser)
  auditLogs: AuditLog[];

  // 权限检查方法
  /**
   * 检查用户是否拥有指定权限
   */
  hasPermission(permission: AdminPermission): boolean {
    // 超级管理员拥有所有权限
    if (this.role === 'super_admin') {
      return true;
    }
    
    // 获取用户的所有有效权限
    const allPermissions = this.getAllPermissions();
    return allPermissions.includes(permission);
  }

  /**
   * 检查用户是否拥有任一权限
   */
  hasAnyPermission(permissions: AdminPermission[]): boolean {
    // 超级管理员拥有所有权限
    if (this.role === 'super_admin') {
      return true;
    }
    
    // 获取用户的所有有效权限
    const allPermissions = this.getAllPermissions();
    return permissions.some(permission => allPermissions.includes(permission));
  }

  /**
   * 检查用户是否拥有所有权限
   */
  hasAllPermissions(permissions: AdminPermission[]): boolean {
    // 超级管理员拥有所有权限
    if (this.role === 'super_admin') {
      return true;
    }
    
    // 获取用户的所有有效权限
    const allPermissions = this.getAllPermissions();
    return permissions.every(permission => allPermissions.includes(permission));
  }

  /**
   * 获取用户所有有效权限（包括角色默认权限）
   */
  getAllPermissions(): AdminPermission[] {
    // 超级管理员拥有所有权限
    if (this.role === 'super_admin') {
      return Object.values(AdminPermission);
    }
    
    // 获取角色默认权限
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[this.role] || [];
    
    // 如果用户有自定义权限，使用自定义权限，否则使用角色默认权限
    if (this.permissions && this.permissions.length > 0) {
      return this.permissions;
    }
    
    return [...rolePermissions];
  }
}
