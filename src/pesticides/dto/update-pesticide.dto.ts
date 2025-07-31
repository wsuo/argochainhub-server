import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  MaxLength,
} from 'class-validator';
import { MultiLangText } from '../../types/multilang';

export class UpdatePesticideDto {
  @ApiProperty({ 
    description: '产品类别（字典值，来源：product_category）',
    example: 'insecticide',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ 
    description: '剂型（字典值，来源：formulation）',
    example: 'TC',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  formulation?: string;

  @ApiProperty({
    description: '产品名称（多语言）',
    example: {
      'zh-CN': '高效氯氟氰菊酯',
      en: 'Lambda-Cyhalothrin',
      es: 'Lambda-Cialotrina',
    },
    required: false
  })
  @IsObject()
  @IsOptional()
  productName?: MultiLangText;

  @ApiProperty({ 
    description: '含量规格',
    example: '96% TC',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  concentration?: string;

  @ApiProperty({ 
    description: '是否显示',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}