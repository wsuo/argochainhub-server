import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsDateString,
  IsPositive,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class UpdatePriceTrendDto {
  @ApiProperty({ 
    description: '周最后日期（如：2025-07-25）',
    example: '2025-07-25',
    required: false
  })
  @IsDateString()
  @IsOptional()
  weekEndDate?: string;

  @ApiProperty({ 
    description: '单位价格（元）',
    example: 125000.50,
    required: false
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ 
    description: '人民币美元汇率（1美元=X人民币）',
    example: 7.2095,
    required: false
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1)
  @Max(20)
  @IsOptional()
  exchangeRate?: number;
}