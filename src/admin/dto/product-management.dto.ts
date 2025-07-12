import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsOptional, IsNotEmpty, IsPositive, IsObject } from 'class-validator';
import { ProductStatus } from '../../entities/product.entity';
import { MultiLangText } from '../../types/multilang';

export class CreateProductDto {
  @ApiProperty({ description: '产品名称（多语言）' })
  @IsNotEmpty()
  @IsObject()
  name: MultiLangText;

  @ApiProperty({ description: '产品分类（多语言）' })
  @IsNotEmpty()
  @IsObject()
  category: MultiLangText;

  @ApiProperty({ description: 'CAS号', required: false })
  @IsOptional()
  @IsString()
  casNo?: string;

  @ApiProperty({ description: '剂型' })
  @IsNotEmpty()
  @IsString()
  formulation: string;

  @ApiProperty({ description: '有效成分（多语言）' })
  @IsNotEmpty()
  @IsObject()
  activeIngredient: MultiLangText;

  @ApiProperty({ description: '含量规格' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: '产品描述（多语言）', required: false })
  @IsOptional()
  @IsObject()
  description?: MultiLangText;

  @ApiProperty({ description: '产品详情', required: false })
  @IsOptional()
  @IsObject()
  details?: {
    toxicity?: string;
    physicalProperties?: object;
    packagingSpecs?: string[];
    storageConditions?: string;
    shelfLife?: string;
  };

  @ApiProperty({ description: '供应商企业ID' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  supplierId: number;

  @ApiProperty({ description: '产品状态', enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.ACTIVE;

  @ApiProperty({ description: '拒绝原因', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UpdateProductDto {
  @ApiProperty({ description: '产品名称（多语言）', required: false })
  @IsOptional()
  @IsObject()
  name?: MultiLangText;

  @ApiProperty({ description: '产品分类（多语言）', required: false })
  @IsOptional()
  @IsObject()
  category?: MultiLangText;

  @ApiProperty({ description: 'CAS号', required: false })
  @IsOptional()
  @IsString()
  casNo?: string;

  @ApiProperty({ description: '剂型', required: false })
  @IsOptional()
  @IsString()
  formulation?: string;

  @ApiProperty({ description: '有效成分（多语言）', required: false })
  @IsOptional()
  @IsObject()
  activeIngredient?: MultiLangText;

  @ApiProperty({ description: '含量规格', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '产品描述（多语言）', required: false })
  @IsOptional()
  @IsObject()
  description?: MultiLangText;

  @ApiProperty({ description: '产品详情', required: false })
  @IsOptional()
  @IsObject()
  details?: {
    toxicity?: string;
    physicalProperties?: object;
    packagingSpecs?: string[];
    storageConditions?: string;
    shelfLife?: string;
  };

  @ApiProperty({ description: '供应商企业ID', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  supplierId?: number;

  @ApiProperty({ description: '产品状态', enum: ProductStatus, required: false })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ description: '拒绝原因', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}