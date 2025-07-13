import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { MultiLangText } from '../../types/multilang';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MultiLangTextDto {
  @ApiProperty({ description: '中文', example: '示例文本' })
  @IsString()
  'zh-CN': string;

  @ApiProperty({ description: '英文', example: 'Example Text' })
  @IsString()
  en: string;

  @ApiProperty({ description: '西班牙文', example: 'Texto de Ejemplo' })
  @IsString()
  es: string;
}

// 字典分类相关DTO
export class CreateDictionaryCategoryDto {
  @ApiProperty({ description: '分类代码', example: 'business_type' })
  @IsString()
  code: string;

  @ApiProperty({ description: '分类名称', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  name: MultiLangText;

  @ApiPropertyOptional({ description: '分类描述', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  @IsOptional()
  description?: MultiLangText;

  @ApiPropertyOptional({ description: '是否为系统分类', default: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: '是否激活', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateDictionaryCategoryDto {
  @ApiPropertyOptional({ description: '分类名称', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  @IsOptional()
  name?: MultiLangText;

  @ApiPropertyOptional({ description: '分类描述', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  @IsOptional()
  description?: MultiLangText;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// 字典项相关DTO
export class CreateDictionaryItemDto {
  @ApiProperty({ description: '字典项代码', example: 'supplier' })
  @IsString()
  code: string;

  @ApiProperty({ description: '字典项名称', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  name: MultiLangText;

  @ApiPropertyOptional({ description: '字典项描述', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  @IsOptional()
  description?: MultiLangText;

  @ApiPropertyOptional({ description: '扩展数据', example: { iso2: 'CN', countryCode: '+86' } })
  @IsObject()
  @IsOptional()
  extraData?: object;

  @ApiPropertyOptional({ description: '是否为系统字典项', default: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: '是否激活', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '父级字典项ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}

export class UpdateDictionaryItemDto {
  @ApiPropertyOptional({ description: '字典项名称', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  @IsOptional()
  name?: MultiLangText;

  @ApiPropertyOptional({ description: '字典项描述', type: MultiLangTextDto })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  @IsOptional()
  description?: MultiLangText;

  @ApiPropertyOptional({ description: '扩展数据' })
  @IsObject()
  @IsOptional()
  extraData?: object;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '父级字典项ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}

// 批量导入DTO
export class BatchImportDictionaryItemDto {
  @ApiProperty({ description: '字典项列表', type: [CreateDictionaryItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateDictionaryItemDto)
  items: CreateDictionaryItemDto[];
}

// 查询DTO
export class DictionaryCategoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '分类代码搜索' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '是否为系统分类' })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}

export class DictionaryItemQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '字典项代码搜索' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '通用搜索（搜索代码和名称）' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '是否激活' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '是否为系统字典项' })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: '父级字典项ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}