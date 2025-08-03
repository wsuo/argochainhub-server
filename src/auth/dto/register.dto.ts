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
  ValidateIf,
} from 'class-validator';
import { CompanyType, CompanySize } from '../../entities/company.entity';
import { UserType } from '../../entities/user.entity';
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
    enum: UserType, 
    example: UserType.INDIVIDUAL_BUYER,
    description: '用户类型：个人采购商或供应商企业用户'
  })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  // 供应商企业信息字段（当userType为SUPPLIER时必填）
  @ApiPropertyOptional({
    example: {
      'zh-CN': '环球农化股份有限公司',
      en: 'Global Agrochem Inc.',
      es: 'Global Agrochem S.A.',
    },
    description: '企业名称（多语言），供应商必填',
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsValidMultiLangText()
  @IsNotEmpty()
  companyName?: MultiLangText;

  @ApiPropertyOptional({ 
    enum: CompanyType, 
    example: CompanyType.SUPPLIER,
    description: '企业类型，供应商时默认为SUPPLIER' 
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsEnum(CompanyType)
  @IsOptional()
  companyType?: CompanyType;

  // 供应商企业详细信息字段（可选）
  @ApiPropertyOptional({ example: 'cn', description: '国家代码，供应商可选' })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ 
    example: ['pesticide_supplier', 'fertilizer_supplier'], 
    description: '业务类别代码列表，供应商可选' 
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
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
    description: '业务范围描述（多语言），供应商可选',
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsValidMultiLangText()
  @IsOptional()
  businessScope?: MultiLangText;

  @ApiPropertyOptional({ enum: CompanySize, example: CompanySize.MEDIUM, description: '公司规模，供应商可选' })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '除草剂、杀虫剂、杀菌剂、植物生长调节剂',
      en: 'Herbicides, Insecticides, Fungicides, Plant Growth Regulators',
      es: 'Herbicidas, Insecticidas, Fungicidas, Reguladores del Crecimiento de Plantas',
    },
    description: '主要产品（多语言），供应商可选',
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsValidMultiLangText()
  @IsOptional()
  mainProducts?: MultiLangText;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '中化集团、先正达、拜耳作物科学',
      en: 'ChemChina, Syngenta, Bayer Crop Science',
      es: 'ChemChina, Syngenta, Bayer Crop Science',
    },
    description: '主要供应商（多语言），供应商可选',
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsValidMultiLangText()
  @IsOptional()
  mainSuppliers?: MultiLangText;

  @ApiPropertyOptional({ 
    example: 5000000.00, 
    description: '年进口/出口额（美元），供应商可选' 
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsNumber()
  @IsOptional()
  annualImportExportValue?: number;

  @ApiPropertyOptional({ example: 'REG123456789', description: '注册证号，供应商可选' })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'TAX987654321', description: '税号，供应商可选' })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsString()
  @IsOptional()
  taxNumber?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/business-license.jpg', 
    description: '营业执照图片地址，供应商可选' 
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsUrl()
  @IsOptional()
  businessLicenseUrl?: string;

  @ApiPropertyOptional({ 
    example: [
      'https://example.com/office1.jpg',
      'https://example.com/factory1.jpg'
    ], 
    description: '公司照片地址列表，供应商可选' 
  })
  @ValidateIf(o => o.userType === UserType.SUPPLIER)
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  companyPhotosUrls?: string[];
}
