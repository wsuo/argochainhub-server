import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsPositive,
  Min,
  Max,
} from 'class-validator';

export class CreatePriceTrendDto {
  @ApiProperty({ 
    description: '周最后日期（如：2025-07-25）',
    example: '2025-07-25'
  })
  @IsDateString()
  @IsNotEmpty()
  weekEndDate: string;

  @ApiProperty({ 
    description: '单位价格（元）',
    example: 125000.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice: number;

  @ApiProperty({ 
    description: '人民币美元汇率（1美元=X人民币）',
    example: 7.2095
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1)
  @Max(20)
  exchangeRate: number;

  @ApiProperty({ 
    description: '标准农药ID',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  pesticideId: number;
}