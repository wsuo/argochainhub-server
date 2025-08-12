import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductsLookupDto {
  @ApiPropertyOptional({ 
    description: '搜索关键词，支持产品名称、农药名、注册证号模糊搜索',
    example: '杀虫剂' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: '供应商ID，按供应商筛选产品',
    example: 26 
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  supplierId?: number;

  @ApiPropertyOptional({ 
    description: '页码，从1开始',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: '每页数量，默认10，最大50',
    example: 10,
    minimum: 1,
    maximum: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}