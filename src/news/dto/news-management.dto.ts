import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  IsUrl,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultiLangText } from '../../types/multilang';

export class CreateNewsDto {
  @ApiProperty({
    description: '新闻标题（多语言）',
    example: {
      'zh-CN': '农药行业新政策发布',
      en: 'New Policies Released for Pesticide Industry',
      es: 'Nuevas Políticas Publicadas para la Industria de Pesticidas',
    },
  })
  @IsObject()
  @IsNotEmpty()
  title: MultiLangText;

  @ApiProperty({
    description: '新闻内容（多语言，支持富文本或HTML）',
    example: {
      'zh-CN': '<p>农业部今日发布了新的农药管理条例...</p>',
      en: '<p>The Ministry of Agriculture released new pesticide management regulations today...</p>',
      es: '<p>El Ministerio de Agricultura publicó hoy nuevas regulaciones de gestión de pesticidas...</p>',
    },
  })
  @IsObject()
  @IsNotEmpty()
  content: MultiLangText;

  @ApiPropertyOptional({
    description: '新闻类别（字典值）',
    example: 'NEWS_POLICY',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: '封面图URL',
    example: 'https://example.com/images/news-cover.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: '是否发布',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateNewsDto extends CreateNewsDto {}

export class NewsQueryDto {
  @ApiPropertyOptional({
    description: '新闻类别',
    example: 'NEWS_POLICY',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: '是否发布',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: '搜索关键词（支持标题模糊搜索）',
    example: '农药',
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: '当前页码',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  pageSize?: number;
}