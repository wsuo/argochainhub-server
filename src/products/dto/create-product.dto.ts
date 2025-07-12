import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultiLangText } from '../../types/multilang';

export class CreateProductDto {
  @ApiProperty({
    example: {
      'zh-CN': '草甘膦原药',
      en: 'Glyphosate Technical',
      es: 'Glifosato Técnico',
    },
  })
  @IsObject()
  @IsNotEmpty()
  name: MultiLangText;

  @ApiProperty({
    example: {
      'zh-CN': '除草剂',
      en: 'Herbicide',
      es: 'Herbicida',
    },
  })
  @IsObject()
  @IsNotEmpty()
  category: MultiLangText;

  @ApiPropertyOptional({ example: '1071-83-6' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  casNo?: string;

  @ApiProperty({ example: '95%原药' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  formulation: string;

  @ApiProperty({
    example: {
      'zh-CN': '草甘膦',
      en: 'Glyphosate',
      es: 'Glifosato',
    },
  })
  @IsObject()
  @IsNotEmpty()
  activeIngredient: MultiLangText;

  @ApiProperty({ example: '95%' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  content: string;

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
