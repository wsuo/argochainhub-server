import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdminPermission, AdminRole } from '../../types/permissions';

export class AdminUserQueryDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页条数', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: '用户名搜索', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '角色筛选', required: false, enum: ['admin', 'super_admin', 'moderator'] })
  @IsOptional()
  @IsEnum(['admin', 'super_admin', 'moderator'])
  role?: AdminRole;

  @ApiProperty({ description: '账户状态', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '创建开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdStartDate?: string;

  @ApiProperty({ description: '创建结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdEndDate?: string;
}

export class CreateAdminUserDto {
  @ApiProperty({ description: '用户名', example: 'admin_user' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: '角色', example: 'admin', enum: ['admin', 'super_admin', 'moderator'] })
  @IsEnum(['admin', 'super_admin', 'moderator'])
  role: AdminRole;

  @ApiProperty({ 
    description: '用户权限列表', 
    example: ['company:view', 'company:create'], 
    required: false,
    isArray: true,
    enum: AdminPermission
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions?: AdminPermission[];

  @ApiProperty({ description: '是否激活', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateAdminUserDto {
  @ApiProperty({ description: '用户名', example: 'admin_user', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({ description: '角色', example: 'admin', enum: ['admin', 'super_admin', 'moderator'], required: false })
  @IsOptional()
  @IsEnum(['admin', 'super_admin', 'moderator'])
  role?: AdminRole;

  @ApiProperty({ 
    description: '用户权限列表', 
    example: ['company:view', 'company:create'], 
    required: false,
    isArray: true,
    enum: AdminPermission
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions?: AdminPermission[];

  @ApiProperty({ description: '是否激活', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码', example: 'oldpassword123' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ description: '新密码', example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码', example: 'newpassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword: string;
}

export class AdminUserStatsDto {
  @ApiProperty({ description: '总管理员数量' })
  totalAdmins: number;

  @ApiProperty({ description: '激活管理员数量' })
  activeAdmins: number;

  @ApiProperty({ description: '停用管理员数量' })
  inactiveAdmins: number;

  @ApiProperty({ description: '超级管理员数量' })
  superAdmins: number;

  @ApiProperty({ description: '普通管理员数量' })
  admins: number;

  @ApiProperty({ description: '审核员数量' })
  moderators: number;
}

// 权限管理相关DTO
export class PermissionGroupDto {
  @ApiProperty({ description: '权限组名称', example: 'COMPANY' })
  groupName: string;

  @ApiProperty({ description: '权限组显示名称', example: '企业管理' })
  groupDisplayName: string;

  @ApiProperty({ description: '权限列表', isArray: true })
  permissions: PermissionItemDto[];
}

export class PermissionItemDto {
  @ApiProperty({ description: '权限标识', example: 'company:view' })
  permission: AdminPermission;

  @ApiProperty({ description: '权限描述', example: '查看企业信息' })
  description: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ 
    description: '权限列表', 
    example: ['company:view', 'company:create'], 
    isArray: true,
    enum: AdminPermission
  })
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions: AdminPermission[];
}

export class RoleTemplateDto {
  @ApiProperty({ description: '角色名称', example: 'admin' })
  role: AdminRole;

  @ApiProperty({ description: '角色显示名称', example: '管理员' })
  displayName: string;

  @ApiProperty({ description: '默认权限列表', isArray: true })
  defaultPermissions: AdminPermission[];

  @ApiProperty({ description: '权限描述' })
  description: string;
}

export class AdminUserPermissionDto {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '角色' })
  role: AdminRole;

  @ApiProperty({ description: '具体权限列表', isArray: true })
  permissions: AdminPermission[];

  @ApiProperty({ description: '所有有效权限列表', isArray: true })
  allPermissions: AdminPermission[];

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;
}