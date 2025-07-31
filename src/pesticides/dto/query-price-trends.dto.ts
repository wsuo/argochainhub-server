import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPriceTrendsDto {
  @ApiProperty({ 
    description: '页码',
    example: 1,
    required: false,
    default: 1
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    description: '每页数量',
    example: 20,
    required: false,
    default: 20
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({ 
    description: '标准农药ID筛选',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pesticideId?: number;

  @ApiProperty({ 
    description: '开始日期筛选',
    example: '2024-01-01',
    required: false
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    description: '结束日期筛选',
    example: '2025-07-31',
    required: false
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ 
    description: '排序字段',
    example: 'weekEndDate',
    enum: ['weekEndDate', 'unitPrice', 'exchangeRate', 'createdAt'],
    required: false,
    default: 'weekEndDate'
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'weekEndDate';

  @ApiProperty({ 
    description: '排序方向',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
    default: 'DESC'
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}