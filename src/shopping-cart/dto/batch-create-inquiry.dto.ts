import { IsArray, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BatchInquiryItemDto {
  @ApiProperty({
    description: '购物车项目ID',
    example: 1
  })
  @IsNumber()
  cartItemId: number;

  @ApiProperty({
    description: '包装要求',
    example: '密封包装',
    required: false
  })
  @IsOptional()
  @IsString()
  packagingReq?: string;
}

export class BatchCreateInquiryDto {
  @ApiProperty({
    description: '供应商ID',
    example: 1
  })
  @IsNumber()
  supplierId: number;

  @ApiProperty({
    description: '询价项目列表',
    type: [BatchInquiryItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchInquiryItemDto)
  items: BatchInquiryItemDto[];

  @ApiProperty({
    description: '交货地点',
    example: '上海',
    required: false
  })
  @IsOptional()
  @IsString()
  deliveryLocation?: string;

  @ApiProperty({
    description: '贸易条款',
    example: 'FOB',
    required: false
  })
  @IsOptional()
  @IsString()
  tradeTerms?: string;

  @ApiProperty({
    description: '付款方式',
    example: 'T/T',
    required: false
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({
    description: '买方备注',
    example: '希望尽快报价',
    required: false
  })
  @IsOptional()
  @IsString()
  buyerRemarks?: string;
}