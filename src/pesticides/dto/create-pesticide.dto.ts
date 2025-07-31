import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  MaxLength,
} from 'class-validator';
import { MultiLangText } from '../../types/multilang';

export class CreatePesticideDto {
  @ApiProperty({ 
    description: '产品类别（字典值，来源：product_category）',
    example: 'insecticide'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @ApiProperty({ 
    description: '剂型（字典值，来源：formulation）',
    example: 'TC'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  formulation: string;

  @ApiProperty({
    description: '产品名称（多语言）',
    example: {
      'zh-CN': '高效氯氟氰菊酯',
      en: 'Lambda-Cyhalothrin',
      es: 'Lambda-Cialotrina',
    },
  })
  @IsObject()
  @IsNotEmpty()
  productName: MultiLangText;

  @ApiProperty({ 
    description: '含量规格',
    example: '96% TC'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  concentration: string;

  @ApiProperty({ 
    description: '是否显示',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean = true;
}