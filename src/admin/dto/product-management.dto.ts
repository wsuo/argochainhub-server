import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsBoolean, 
  IsDateString, 
  IsArray, 
  ValidateNested,
  Min
} from 'class-validator';
import { ToxicityLevel, ProductStatus, convertToxicityLevel } from '../../types/product';
import { MultiLangText } from '../../types/multilang';

/**
 * 多语言文本DTO
 */
export class MultiLangTextDto {
  @ApiProperty({ description: '中文', example: '草甘膦原药' })
  @IsNotEmpty()
  @IsString()
  'zh-CN': string;

  @ApiProperty({ description: '英文', example: 'Glyphosate Technical' })
  @IsNotEmpty()
  @IsString()
  en: string;

  @ApiPropertyOptional({ description: '西班牙文', example: 'Glifosato Técnico' })
  @IsOptional()
  @IsString()
  es?: string;
}

/**
 * 有效成分DTO
 */
export class ActiveIngredientDto {
  @ApiProperty({ 
    description: '有效成分名称（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  name: MultiLangTextDto;

  @ApiProperty({ description: '有效成分含量', example: '95%' })
  @IsNotEmpty()
  @IsString()
  content: string;
}

/**
 * 产品详细信息DTO
 */
export class ProductDetailsDto {
  @ApiPropertyOptional({ description: '产品说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '产品品类' })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ 
    description: '出口限制国家列表',
    example: ['US', 'CA', 'AU']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exportRestrictedCountries?: string[];
}

/**
 * 创建产品DTO
 */
export class CreateProductDto {
  @ApiProperty({ 
    description: '产品名称（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  name: MultiLangTextDto;

  @ApiProperty({ 
    description: '农药名称（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  pesticideName: MultiLangTextDto;

  @ApiProperty({ description: '供应商ID' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  supplierId: number;

  @ApiPropertyOptional({ description: '最低起订量' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minOrderQuantity?: number;

  @ApiPropertyOptional({ description: '最低起订量单位' })
  @IsOptional()
  @IsString()
  minOrderUnit?: string;

  @ApiPropertyOptional({ description: '登记证号' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: '登记证持有人' })
  @IsOptional()
  @IsString()
  registrationHolder?: string;

  @ApiPropertyOptional({ description: '有效截止日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: '首次批准日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  firstApprovalDate?: string;

  @ApiPropertyOptional({ description: '剂型（字典值）' })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiPropertyOptional({ description: '总含量' })
  @IsOptional()
  @IsString()
  totalContent?: string;

  @ApiPropertyOptional({ 
    description: '毒性等级（字典值或语义值：LOW/MEDIUM/HIGH/ACUTE）',
    enum: ToxicityLevel,
    examples: {
      number: { value: 2, description: '数字值：2 表示低毒' },
      semantic: { value: 'LOW', description: '语义值：LOW 表示低毒' }
    }
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const converted = convertToxicityLevel(value);
    return converted !== undefined ? converted : value;
  })
  @IsEnum(ToxicityLevel)
  toxicity?: ToxicityLevel;

  @ApiPropertyOptional({ 
    description: '有效成分1',
    type: ActiveIngredientDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActiveIngredientDto)
  activeIngredient1?: ActiveIngredientDto;

  @ApiPropertyOptional({ 
    description: '有效成分2',
    type: ActiveIngredientDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActiveIngredientDto)
  activeIngredient2?: ActiveIngredientDto;

  @ApiPropertyOptional({ 
    description: '有效成分3',
    type: ActiveIngredientDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActiveIngredientDto)
  activeIngredient3?: ActiveIngredientDto;

  @ApiPropertyOptional({ 
    description: '产品详细信息',
    type: ProductDetailsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDetailsDto)
  details?: ProductDetailsDto;

  @ApiPropertyOptional({ description: '是否上架', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isListed?: boolean;

  @ApiPropertyOptional({ 
    description: '产品状态',
    enum: ProductStatus,
    default: ProductStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

/**
 * 更新产品DTO
 */
export class UpdateProductDto {
  @ApiPropertyOptional({ 
    description: '产品名称（多语言）',
    type: MultiLangTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  name?: MultiLangTextDto;

  @ApiPropertyOptional({ 
    description: '农药名称（多语言）',
    type: MultiLangTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  pesticideName?: MultiLangTextDto;

  @ApiPropertyOptional({ description: '供应商ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @ApiPropertyOptional({ description: '最低起订量' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minOrderQuantity?: number;

  @ApiPropertyOptional({ description: '最低起订量单位' })
  @IsOptional()
  @IsString()
  minOrderUnit?: string;

  @ApiPropertyOptional({ description: '登记证号' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: '登记证持有人' })
  @IsOptional()
  @IsString()
  registrationHolder?: string;

  @ApiPropertyOptional({ description: '有效截止日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: '首次批准日期 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  firstApprovalDate?: string;

  @ApiPropertyOptional({ description: '剂型（字典值）' })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiPropertyOptional({ description: '总含量' })
  @IsOptional()
  @IsString()
  totalContent?: string;

  @ApiPropertyOptional({ 
    description: '毒性等级（字典值或语义值：LOW/MEDIUM/HIGH/ACUTE）',
    enum: ToxicityLevel,
    examples: {
      number: { value: 2, description: '数字值：2 表示低毒' },
      semantic: { value: 'LOW', description: '语义值：LOW 表示低毒' }
    }
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const converted = convertToxicityLevel(value);
    return converted !== undefined ? converted : value;
  })
  @IsEnum(ToxicityLevel)
  toxicity?: ToxicityLevel;

  @ApiPropertyOptional({ 
    description: '有效成分1',
    type: ActiveIngredientDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActiveIngredientDto)
  activeIngredient1?: ActiveIngredientDto;

  @ApiPropertyOptional({ 
    description: '有效成分2',
    type: ActiveIngredientDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActiveIngredientDto)
  activeIngredient2?: ActiveIngredientDto;

  @ApiPropertyOptional({ 
    description: '有效成分3',
    type: ActiveIngredientDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActiveIngredientDto)
  activeIngredient3?: ActiveIngredientDto;

  @ApiPropertyOptional({ 
    description: '产品详细信息',
    type: ProductDetailsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDetailsDto)
  details?: ProductDetailsDto;

  @ApiPropertyOptional({ description: '是否上架' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isListed?: boolean;

  @ApiPropertyOptional({ 
    description: '产品状态',
    enum: ProductStatus
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: '拒绝原因' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}