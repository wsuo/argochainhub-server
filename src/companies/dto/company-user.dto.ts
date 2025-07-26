import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsDateString, 
  IsUrl, 
  MinLength, 
  MaxLength,
  IsPhoneNumber,
  IsBoolean,
  IsPositive,
  Max,
  Min
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

/**
 * 创建企业用户DTO
 */
export class CreateCompanyUserDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '用户姓名', example: '张三' })
  @IsString()
  @MinLength(2, { message: '姓名至少2个字符' })
  @MaxLength(50, { message: '姓名最多50个字符' })
  name: string;

  @ApiProperty({ description: '初始密码', example: 'password123' })
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @ApiPropertyOptional({ description: '电话号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsUrl({}, { message: '请输入有效的头像URL' })
  avatar?: string;

  @ApiPropertyOptional({ description: '职位/岗位', example: '产品经理' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '职位最多100个字符' })
  position?: string;

  @ApiPropertyOptional({ description: '部门', example: '技术部' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '部门最多100个字符' })
  department?: string;

  @ApiPropertyOptional({ description: '入职时间', example: '2025-01-01' })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  joinedAt?: string;

  @ApiProperty({ description: '用户角色', enum: UserRole, default: UserRole.MEMBER })
  @IsEnum(UserRole, { message: '请选择有效的用户角色' })
  role: UserRole = UserRole.MEMBER;

  @ApiPropertyOptional({ description: '是否激活', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

/**
 * 更新企业用户DTO
 */
export class UpdateCompanyUserDto {
  @ApiPropertyOptional({ description: '用户姓名', example: '张三' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '姓名至少2个字符' })
  @MaxLength(50, { message: '姓名最多50个字符' })
  name?: string;

  @ApiPropertyOptional({ description: '电话号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsUrl({}, { message: '请输入有效的头像URL' })
  avatar?: string;

  @ApiPropertyOptional({ description: '职位/岗位', example: '产品经理' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '职位最多100个字符' })
  position?: string;

  @ApiPropertyOptional({ description: '部门', example: '技术部' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '部门最多100个字符' })
  department?: string;

  @ApiPropertyOptional({ description: '入职时间', example: '2025-01-01' })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  joinedAt?: string;

  @ApiPropertyOptional({ description: '用户角色', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: '请选择有效的用户角色' })
  role?: UserRole;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '邮箱是否已验证' })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}

/**
 * 企业用户查询DTO
 */
export class CompanyUserQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: '页码' })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, description: '每页条数' })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '搜索关键词（用户邮箱、姓名、电话）' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: '用户角色' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '部门' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: '职位' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: '是否已激活' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '是否已验证邮箱' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: '入职开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  joinedStartDate?: string;

  @ApiPropertyOptional({ description: '入职结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  joinedEndDate?: string;

  @ApiPropertyOptional({ description: '排序字段', enum: ['createdAt', 'updatedAt', 'name', 'joinedAt'] })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'name', 'joinedAt'])
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'joinedAt';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}