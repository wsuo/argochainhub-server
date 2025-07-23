import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min, IsEnum, IsString, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { CompanyStatus, CompanyType } from '../../entities/company.entity';

export class CompanyQueryDto {
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

  @ApiPropertyOptional({ enum: CompanyStatus, description: '企业状态' })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ enum: CompanyType, description: '企业类型' })
  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;

  @ApiPropertyOptional({ description: '搜索关键词（企业名称、描述）' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '国家代码（如：cn, us, de）' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: '业务类别', isArray: true, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessCategories?: string[];

  @ApiPropertyOptional({ description: '业务类别（前端兼容字段）' })
  @IsOptional()
  @IsString()
  businessCategory?: string;

  @ApiPropertyOptional({ description: '业务类别（前端兼容字段）', isArray: true, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessTypes?: string[];

  @ApiPropertyOptional({ description: '企业规模' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ description: '企业规模（前端兼容字段）' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: '是否已认证' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: '是否百强企业' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isTop100?: boolean;

  @ApiPropertyOptional({ description: '创建开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  createdStartDate?: string;

  @ApiPropertyOptional({ description: '创建结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  createdEndDate?: string;

  @ApiPropertyOptional({ description: '最低评分' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: '最高评分' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({ description: '是否有企业邮箱' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasEmail?: boolean;

  @ApiPropertyOptional({ description: '是否有网站' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWebsite?: boolean;

  @ApiPropertyOptional({ description: '排序字段', enum: ['createdAt', 'updatedAt', 'rating', 'name'] })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'rating', 'name'])
  sortBy?: 'createdAt' | 'updatedAt' | 'rating' | 'name';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}