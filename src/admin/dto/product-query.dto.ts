import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min, IsEnum, IsString, IsBoolean, IsDateString, IsArray, IsNumber } from 'class-validator';
import { ProductStatus, ToxicityLevel } from '../../types/product';

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

  @ApiPropertyOptional({ description: '搜索关键词（产品名称、农药名称、登记证号）' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '供应商ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @ApiPropertyOptional({ description: '供应商名称' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ description: '剂型（字典值）' })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiPropertyOptional({ 
    description: '毒性等级（字典值）',
    enum: ToxicityLevel
  })
  @IsOptional()
  @IsEnum(ToxicityLevel)
  toxicity?: ToxicityLevel;

  @ApiPropertyOptional({ description: '有效成分名称' })
  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @ApiPropertyOptional({ description: '登记证号' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: '登记证持有人' })
  @IsOptional()
  @IsString()
  registrationHolder?: string;

  @ApiPropertyOptional({ description: '产品品类' })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiPropertyOptional({ description: '国家代码' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: '出口限制国家', isArray: true, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exportRestrictedCountries?: string[];

  @ApiPropertyOptional({ description: '最低起订量（最小）' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minOrderQuantityMin?: number;

  @ApiPropertyOptional({ description: '最低起订量（最大）' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minOrderQuantityMax?: number;

  @ApiPropertyOptional({ description: '是否上架' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isListed?: boolean;

  @ApiPropertyOptional({ description: '有效截止日期（开始）' })
  @IsOptional()
  @IsDateString()
  effectiveDateStart?: string;

  @ApiPropertyOptional({ description: '有效截止日期（结束）' })
  @IsOptional()
  @IsDateString()
  effectiveDateEnd?: string;

  @ApiPropertyOptional({ description: '首次批准日期（开始）' })
  @IsOptional()
  @IsDateString()
  firstApprovalDateStart?: string;

  @ApiPropertyOptional({ description: '首次批准日期（结束）' })
  @IsOptional()
  @IsDateString()
  firstApprovalDateEnd?: string;

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

  @ApiPropertyOptional({ description: '是否有防治方法' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasControlMethods?: boolean;

  @ApiPropertyOptional({ 
    description: '排序字段', 
    enum: ['createdAt', 'updatedAt', 'name', 'pesticideName', 'effectiveDate', 'firstApprovalDate', 'minOrderQuantity'] 
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'name', 'pesticideName', 'effectiveDate', 'firstApprovalDate', 'minOrderQuantity'])
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'pesticideName' | 'effectiveDate' | 'firstApprovalDate' | 'minOrderQuantity';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}