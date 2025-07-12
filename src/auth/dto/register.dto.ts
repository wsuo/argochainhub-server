import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { CompanyType } from '../../entities/company.entity';
import { MultiLangText } from '../../types/multilang';
import { IsValidMultiLangText } from '../../common/validators/multilang.validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    example: {
      'zh-CN': '环球农化股份有限公司',
      en: 'Global Agrochem Inc.',
      es: 'Global Agrochem S.A.',
    },
    description: '企业名称（多语言）',
  })
  @IsValidMultiLangText()
  companyName: MultiLangText;

  @ApiProperty({ enum: CompanyType, example: CompanyType.BUYER })
  @IsEnum(CompanyType)
  @IsNotEmpty()
  companyType: CompanyType;
}
