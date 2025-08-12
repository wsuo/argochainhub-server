import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SupportedLanguage } from '../../types/multilang';

export class SearchProductsDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '产品分类' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: '供应商ID，按供应商筛选产品',
    example: 26 
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  supplierId?: number;

  @ApiPropertyOptional({
    description: '搜索语言',
    enum: ['zh-CN', 'en', 'es'],
    example: 'zh-CN',
  })
  @IsOptional()
  @IsEnum(['zh-CN', 'en', 'es'])
  language?: SupportedLanguage;
}
