import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, MaxLength } from 'class-validator';
import { MultiLangText } from '../../types/multilang';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: {
      'zh-CN': '草甘膦原药',
      en: 'Glyphosate Technical',
      es: 'Glifosato Técnico',
    },
  })
  @IsObject()
  @IsOptional()
  name?: MultiLangText;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '除草剂',
      en: 'Herbicide',
      es: 'Herbicida',
    },
  })
  @IsObject()
  @IsOptional()
  category?: MultiLangText;

  @ApiPropertyOptional({ example: '1071-83-6' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  casNo?: string;

  @ApiPropertyOptional({ example: '95%原药' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  formulation?: string;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '草甘膦',
      en: 'Glyphosate',
      es: 'Glifosato',
    },
  })
  @IsObject()
  @IsOptional()
  activeIngredient?: MultiLangText;

  @ApiPropertyOptional({ example: '95%' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  content?: string;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '高效除草剂，广谱杀草效果好',
      en: 'High-efficiency herbicide with broad-spectrum weed control',
      es: 'Herbicida de alta eficiencia con control de malezas de amplio espectro',
    },
  })
  @IsObject()
  @IsOptional()
  description?: MultiLangText;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  details?: {
    toxicity?: string;
    physicalProperties?: object;
    packagingSpecs?: string[];
    storageConditions?: string;
    shelfLife?: string;
  };
}
