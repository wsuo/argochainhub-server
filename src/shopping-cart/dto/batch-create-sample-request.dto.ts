import { IsArray, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BatchSampleRequestItemDto {
  @ApiProperty({
    description: '购物车项目ID',
    example: 1
  })
  @IsNumber()
  cartItemId: number;

  @ApiProperty({
    description: '样品数量',
    example: 1
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: '样品单位',
    example: 'kg'
  })
  @IsString()
  unit: string;
}

export class BatchCreateSampleRequestDto {
  @ApiProperty({
    description: '供应商ID',
    example: 1
  })
  @IsNumber()
  supplierId: number;

  @ApiProperty({
    description: '样品申请项目列表',
    type: [BatchSampleRequestItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSampleRequestItemDto)
  items: BatchSampleRequestItemDto[];

  @ApiProperty({
    description: '申请目的',
    example: '产品测试',
    required: false
  })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({
    description: '收货地址',
    example: '上海市浦东新区',
    required: false
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({
    description: '物流方式',
    example: 'DHL',
    required: false
  })
  @IsOptional()
  @IsString()
  shippingMethod?: string;
}