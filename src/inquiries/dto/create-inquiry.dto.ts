import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsArray, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InquiryItemDto {
  @ApiProperty({ example: 1, description: '产品ID' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ example: 1000, description: '询价数量' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 'kg', description: '数量单位' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ example: '25kg/袋装', description: '包装要求', required: false })
  @IsString()
  @IsOptional()
  packagingReq?: string;
}

export class CreateInquiryDto {
  @ApiProperty({ example: 1, description: '供应商企业ID' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  supplierId: number;

  @ApiProperty({
    type: [InquiryItemDto],
    description: '询价产品列表',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InquiryItemDto)
  @IsNotEmpty()
  items: InquiryItemDto[];

  @ApiProperty({
    example: {
      deliveryLocation: '上海港',
      tradeTerms: 'FOB',
      paymentMethod: 'T/T',
      buyerRemarks: '需要质量检测报告',
    },
    description: '询价详情',
  })
  @IsObject()
  @IsNotEmpty()
  details: {
    deliveryLocation?: string;
    tradeTerms?: string;
    paymentMethod?: string;
    buyerRemarks?: string;
  };

  @ApiProperty({ example: '2024-02-01', description: '报价截止日期' })
  @IsString()
  @IsNotEmpty()
  deadline: string;
}