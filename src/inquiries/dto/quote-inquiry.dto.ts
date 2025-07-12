import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsObject,
  IsDateString,
} from 'class-validator';

export class QuoteInquiryDto {
  @ApiProperty({
    example: {
      totalPrice: 10000,
      validUntil: '2024-02-15',
      supplierRemarks: '价格含税，FOB上海港',
    },
    description: '报价详情',
  })
  @IsObject()
  @IsNotEmpty()
  quoteDetails: {
    totalPrice: number;
    validUntil: string;
    supplierRemarks?: string;
  };
}
