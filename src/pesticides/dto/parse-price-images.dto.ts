import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  Min,
  Max,
} from 'class-validator';

export class ParsePriceImagesDto {
  @ApiProperty({ 
    description: '当前汇率（1美元=X人民币）',
    example: 7.2095
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1)
  @Max(20)
  exchangeRate: number;
}

export interface ParsedPriceData {
  productName: string;
  weekEndDate: string;
  unitPrice: number;
}

export interface ImageParseResult {
  success: boolean;
  data: ParsedPriceData[];
  errors: string[];
}