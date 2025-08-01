import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, ValidateNested, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SavePriceDataItemDto {
  @ApiProperty({ 
    description: '产品名称',
    example: '氯氰菊酯原药'
  })
  @IsString()
  productName: string;

  @ApiProperty({ 
    description: '周结束日期',
    example: '2024-01-28'
  })
  @IsString()
  weekEndDate: string;

  @ApiProperty({ 
    description: '单价（美元）',
    example: 12.50
  })
  @IsNumber()
  unitPrice: number;
}

export class SaveParsedPriceDataDto {
  @ApiProperty({ 
    description: '任务ID（可选，用于追踪）',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiProperty({ 
    description: '当前汇率（1美元=X人民币）',
    example: 7.2095,
    minimum: 1,
    maximum: 20
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  exchangeRate: number;

  @ApiProperty({ 
    description: '用户编辑后的价格数据数组',
    type: [SavePriceDataItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SavePriceDataItemDto)
  priceData: SavePriceDataItemDto[];
}