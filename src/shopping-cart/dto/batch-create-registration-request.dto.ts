import { IsArray, IsNumber, IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BatchRegistrationRequestItemDto {
  @ApiProperty({
    description: '购物车项目ID',
    example: 1
  })
  @IsNumber()
  cartItemId: number;
}

export class BatchCreateRegistrationRequestDto {
  @ApiProperty({
    description: '供应商ID',
    example: 1
  })
  @IsNumber()
  supplierId: number;

  @ApiProperty({
    description: '登记申请项目列表',
    type: [BatchRegistrationRequestItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchRegistrationRequestItemDto)
  items: BatchRegistrationRequestItemDto[];

  @ApiProperty({
    description: '目标国家',
    example: 'CN',
    required: false
  })
  @IsOptional()
  @IsString()
  targetCountry?: string;

  @ApiProperty({
    description: '是否独家',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;

  @ApiProperty({
    description: '文档要求',
    example: ['COA', 'MSDS'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  docReqs?: string[];

  @ApiProperty({
    description: '时间要求',
    example: '6个月内',
    required: false
  })
  @IsOptional()
  @IsString()
  timeline?: string;

  @ApiProperty({
    description: '预算',
    example: 10000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  budgetAmount?: number;

  @ApiProperty({
    description: '预算货币',
    example: 'USD',
    required: false
  })
  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @ApiProperty({
    description: '其他要求',
    example: '需要提供技术支持',
    required: false
  })
  @IsOptional()
  @IsString()
  additionalRequirements?: string;
}