import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsObject,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuditAction, AuditResource } from '../../types/audit';

/**
 * 审计日志查询DTO
 */
export class AuditLogQueryDto {
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

  @ApiProperty({ 
    description: '操作类型', 
    enum: AuditAction, 
    required: false 
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiProperty({ 
    description: '资源类型', 
    enum: AuditResource, 
    required: false 
  })
  @IsOptional()
  @IsEnum(AuditResource)
  targetResource?: AuditResource;

  @ApiProperty({ description: '资源ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetId?: number;

  @ApiProperty({ description: '操作管理员ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adminUserId?: number;

  @ApiProperty({ description: '操作管理员用户名', required: false })
  @IsOptional()
  @IsString()
  adminUsername?: string;

  @ApiProperty({ description: 'IP地址', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: '开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '关键字搜索（在操作详情中搜索）', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;
}

/**
 * 审计日志响应DTO
 */
export class AuditLogResponseDto {
  @ApiProperty({ description: '日志ID' })
  id: number;

  @ApiProperty({ description: '操作类型', enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ description: '操作描述' })
  actionDescription: string;

  @ApiProperty({ description: '目标资源类型', enum: AuditResource })
  targetResource: AuditResource;

  @ApiProperty({ description: '目标资源描述' })
  targetResourceDescription: string;

  @ApiProperty({ description: '目标资源ID' })
  targetId: number;

  @ApiProperty({ description: '操作详情', required: false })
  details?: {
    before?: object;
    after?: object;
    reason?: string;
    additionalInfo?: Record<string, any>;
  };

  @ApiProperty({ description: 'IP地址' })
  ipAddress: string;

  @ApiProperty({ description: '操作管理员ID' })
  adminUserId: number;

  @ApiProperty({ description: '操作管理员信息' })
  adminUser: {
    id: number;
    username: string;
    role: string;
  };

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

/**
 * 审计日志统计DTO
 */
export class AuditLogStatsDto {
  @ApiProperty({ description: '总日志数量' })
  totalLogs: number;

  @ApiProperty({ description: '今日操作数量' })
  todayLogs: number;

  @ApiProperty({ description: '本周操作数量' })
  weekLogs: number;

  @ApiProperty({ description: '本月操作数量' })
  monthLogs: number;

  @ApiProperty({ description: '操作类型统计' })
  actionStats: Array<{
    action: AuditAction;
    actionDescription: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: '资源类型统计' })
  resourceStats: Array<{
    resource: AuditResource;
    resourceDescription: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: '活跃管理员统计（最近30天）' })
  activeAdminStats: Array<{
    adminId: number;
    adminUsername: string;
    operationCount: number;
    lastOperationAt: Date;
  }>;
}

/**
 * 审计日志导出DTO
 */
export class AuditLogExportDto {
  @ApiProperty({ 
    description: '导出格式', 
    enum: ['csv', 'excel'], 
    default: 'excel' 
  })
  @IsOptional()
  @IsEnum(['csv', 'excel'])
  format?: 'csv' | 'excel' = 'excel';

  @ApiProperty({ description: '开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    description: '操作类型过滤', 
    enum: AuditAction, 
    isArray: true,
    required: false 
  })
  @IsOptional()
  @IsEnum(AuditAction, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  actions?: AuditAction[];

  @ApiProperty({ 
    description: '资源类型过滤', 
    enum: AuditResource, 
    isArray: true,
    required: false 
  })
  @IsOptional()
  @IsEnum(AuditResource, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  resources?: AuditResource[];

  @ApiProperty({ description: '管理员ID过滤', isArray: true, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  adminUserIds?: number[];
}

/**
 * 创建审计日志DTO（内部使用）
 */
export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsEnum(AuditResource)
  targetResource: AuditResource;

  @IsNumber()
  targetId: number;

  @IsOptional()
  @IsObject()
  details?: {
    before?: object;
    after?: object;
    reason?: string;
    additionalInfo?: Record<string, any>;
  };

  @IsString()
  ipAddress: string;

  @IsNumber()
  adminUserId: number;
}

/**
 * 审计日志操作趋势DTO
 */
export class AuditLogTrendDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '操作数量' })
  count: number;

  @ApiProperty({ description: '操作类型分布' })
  actionBreakdown: Record<AuditAction, number>;
}

/**
 * 审计日志详情分析DTO
 */
export class AuditLogAnalyticsDto {
  @ApiProperty({ description: '时间范围内的操作趋势' })
  trends: AuditLogTrendDto[];

  @ApiProperty({ description: '最活跃的操作类型（TOP 10）' })
  topActions: Array<{
    action: AuditAction;
    description: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: '最活跃的资源类型（TOP 10）' })
  topResources: Array<{
    resource: AuditResource;
    description: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: '最活跃的管理员（TOP 10）' })
  topAdmins: Array<{
    adminId: number;
    username: string;
    role: string;
    operationCount: number;
    lastOperation: Date;
  }>;

  @ApiProperty({ description: '风险操作统计' })
  riskOperations: {
    deletions: number;
    passwordResets: number;
    permissionChanges: number;
    systemConfigs: number;
  };

  @ApiProperty({ description: 'IP地址分布（TOP 10）' })
  ipDistribution: Array<{
    ipAddress: string;
    operationCount: number;
    uniqueAdmins: number;
  }>;
}