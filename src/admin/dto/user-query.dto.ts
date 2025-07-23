import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min, IsEnum, IsString, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UserQueryDto {
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

  @ApiPropertyOptional({ description: '搜索关键词（用户邮箱、姓名）' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: '用户角色' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: '所属企业ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({ description: '企业名称' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: '企业类型' })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiPropertyOptional({ description: '国家代码' })
  @IsOptional()
  @IsString()
  country?: string;

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

  @ApiPropertyOptional({ description: '注册开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  registeredStartDate?: string;

  @ApiPropertyOptional({ description: '注册结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  registeredEndDate?: string;

  @ApiPropertyOptional({ description: '最后登录开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  lastLoginStartDate?: string;

  @ApiPropertyOptional({ description: '最后登录结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  lastLoginEndDate?: string;

  @ApiPropertyOptional({ description: '是否有订阅' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasSubscription?: boolean;

  @ApiPropertyOptional({ description: '是否有付费订阅' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasPaidSubscription?: boolean;

  @ApiPropertyOptional({ description: '排序字段', enum: ['createdAt', 'updatedAt', 'lastLoginAt', 'email'] })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'lastLoginAt', 'email'])
  sortBy?: 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'email';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}