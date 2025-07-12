import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
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
    description: '搜索语言',
    enum: ['zh-CN', 'en', 'es'],
    example: 'zh-CN',
  })
  @IsOptional()
  @IsEnum(['zh-CN', 'en', 'es'])
  language?: SupportedLanguage;
}
