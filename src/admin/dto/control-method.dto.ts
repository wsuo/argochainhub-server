import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsBoolean, 
  ValidateNested,
  Min
} from 'class-validator';
import { MultiLangTextDto } from './product-management.dto';

/**
 * 创建防治方法DTO
 */
export class CreateControlMethodDto {
  @ApiProperty({ description: '产品ID' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @ApiProperty({ 
    description: '目标作物（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  targetCrop: MultiLangTextDto;

  @ApiProperty({ 
    description: '病虫害（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  pestDisease: MultiLangTextDto;

  @ApiProperty({ 
    description: '施用方法（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  applicationMethod: MultiLangTextDto;

  @ApiProperty({ 
    description: '施用剂量（多语言）',
    type: MultiLangTextDto
  })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  dosage: MultiLangTextDto;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * 更新防治方法DTO
 */
export class UpdateControlMethodDto {
  @ApiPropertyOptional({ 
    description: '目标作物（多语言）',
    type: MultiLangTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  targetCrop?: MultiLangTextDto;

  @ApiPropertyOptional({ 
    description: '病虫害（多语言）',
    type: MultiLangTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  pestDisease?: MultiLangTextDto;

  @ApiPropertyOptional({ 
    description: '施用方法（多语言）',
    type: MultiLangTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  applicationMethod?: MultiLangTextDto;

  @ApiPropertyOptional({ 
    description: '施用剂量（多语言）',
    type: MultiLangTextDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  dosage?: MultiLangTextDto;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * 批量创建防治方法DTO
 */
export class BatchCreateControlMethodDto {
  @ApiProperty({ description: '产品ID' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  productId: number;

  @ApiProperty({ 
    description: '防治方法列表',
    type: [CreateControlMethodDto]
  })
  @ValidateNested({ each: true })
  @Type(() => CreateControlMethodDto)
  controlMethods: Omit<CreateControlMethodDto, 'productId'>[];
}