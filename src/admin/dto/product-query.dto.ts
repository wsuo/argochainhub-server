import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min, IsEnum, IsString, IsBoolean, IsDateString, IsArray, IsNumber } from 'class-validator';
import { ProductStatus } from '../../entities/product.entity';

export class ProductQueryDto {
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

  @ApiPropertyOptional({ enum: ProductStatus, description: '产品状态' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: '搜索关键词（产品名称、描述、CAS号）' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '产品分类' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '剂型类型' })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiPropertyOptional({ description: '有效成分' })
  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @ApiPropertyOptional({ description: 'CAS号' })
  @IsOptional()
  @IsString()
  casNo?: string;

  @ApiPropertyOptional({ description: '所属企业ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({ description: '企业类型（买家/供应商）' })
  @IsOptional()
  @IsString()
  companyType?: string;

  @ApiPropertyOptional({ description: '国家代码' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: '最低价格' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: '最高价格' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: '是否有库存' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasStock?: boolean;

  @ApiPropertyOptional({ description: '创建开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  createdStartDate?: string;

  @ApiPropertyOptional({ description: '创建结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  createdEndDate?: string;

  @ApiPropertyOptional({ description: '更新开始日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  updatedStartDate?: string;

  @ApiPropertyOptional({ description: '更新结束日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  updatedEndDate?: string;

  @ApiPropertyOptional({ description: '是否已认证产品' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  certified?: boolean;

  @ApiPropertyOptional({ description: '包装规格', isArray: true, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  packagingSpecs?: string[];

  @ApiPropertyOptional({ description: '排序字段', enum: ['createdAt', 'updatedAt', 'name', 'price'] })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'name', 'price'])
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}