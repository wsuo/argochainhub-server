import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsNumber,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyType, CompanySize } from '../../entities/company.entity';
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

  // 新增详细信息字段
  @ApiPropertyOptional({ example: 'cn', description: '国家代码' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ 
    example: ['pesticide_supplier', 'fertilizer_supplier'], 
    description: '业务类别代码列表' 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  businessCategories?: string[];

  @ApiPropertyOptional({
    example: {
      'zh-CN': '专业从事农药、化肥等农化产品的研发、生产和销售',
      en: 'Professional in R&D, production and sales of pesticides, fertilizers and other agrochemical products',
      es: 'Profesional en I+D, producción y ventas de pesticidas, fertilizantes y otros productos agroquímicos',
    },
    description: '业务范围描述（多语言）',
  })
  @IsValidMultiLangText()
  @IsOptional()
  businessScope?: MultiLangText;

  @ApiPropertyOptional({ enum: CompanySize, example: CompanySize.MEDIUM })
  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '除草剂、杀虫剂、杀菌剂、植物生长调节剂',
      en: 'Herbicides, Insecticides, Fungicides, Plant Growth Regulators',
      es: 'Herbicidas, Insecticidas, Fungicidas, Reguladores del Crecimiento de Plantas',
    },
    description: '主要产品/采购产品（多语言）',
  })
  @IsValidMultiLangText()
  @IsOptional()
  mainProducts?: MultiLangText;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '中化集团、先正达、拜耳作物科学',
      en: 'ChemChina, Syngenta, Bayer Crop Science',
      es: 'ChemChina, Syngenta, Bayer Crop Science',
    },
    description: '主要供应商（采购商填写，多语言）',
  })
  @IsValidMultiLangText()
  @IsOptional()
  mainSuppliers?: MultiLangText;

  @ApiPropertyOptional({ 
    example: 5000000.00, 
    description: '年进口/出口额（美元）' 
  })
  @IsNumber()
  @IsOptional()
  annualImportExportValue?: number;

  @ApiPropertyOptional({ example: 'REG123456789', description: '注册证号' })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'TAX987654321', description: '税号' })
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/business-license.jpg', 
    description: '营业执照图片地址' 
  })
  @IsUrl()
  @IsOptional()
  businessLicenseUrl?: string;

  @ApiPropertyOptional({ 
    example: [
      'https://example.com/office1.jpg',
      'https://example.com/factory1.jpg'
    ], 
    description: '公司照片地址列表' 
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  companyPhotosUrls?: string[];
}
