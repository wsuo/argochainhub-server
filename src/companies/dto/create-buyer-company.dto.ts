import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsUrl,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { CompanySize } from '../../entities/company.entity';
import { MultiLangText } from '../../types/multilang';
import { IsValidMultiLangText } from '../../common/validators/multilang.validator';

export class CreateBuyerCompanyDto {
  @ApiProperty({
    example: {
      'zh-CN': '北京采购有限公司',
      en: 'Beijing Buyer Co., Ltd.',
      es: 'Beijing Buyer Co., Ltd.',
    },
    description: '企业名称（多语言）',
  })
  @IsValidMultiLangText()
  @IsNotEmpty()
  companyName: MultiLangText;

  @ApiPropertyOptional({ example: 'cn', description: '国家代码' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    example: ['domestic_trade', 'international_trade'],
    description: '业务类别代码列表',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  businessCategories?: string[];

  @ApiPropertyOptional({
    example: {
      'zh-CN': '专业从事农化产品采购业务',
      en: 'Professional in agrochemical product procurement',
      es: 'Profesional en adquisición de productos agroquímicos',
    },
    description: '业务范围描述（多语言）',
  })
  @IsValidMultiLangText()
  @IsOptional()
  businessScope?: MultiLangText;

  @ApiPropertyOptional({
    enum: CompanySize,
    example: CompanySize.MEDIUM,
    description: '公司规模',
  })
  @IsEnum(CompanySize)
  @IsOptional()
  companySize?: CompanySize;

  @ApiPropertyOptional({
    example: {
      'zh-CN': '除草剂、杀虫剂、杀菌剂采购',
      en: 'Herbicides, Insecticides, Fungicides procurement',
      es: 'Adquisición de herbicidas, insecticidas, fungicidas',
    },
    description: '主要采购产品（多语言）',
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
    description: '主要合作供应商（多语言）',
  })
  @IsValidMultiLangText()
  @IsOptional()
  mainSuppliers?: MultiLangText;

  @ApiPropertyOptional({
    example: 2000000.0,
    description: '年采购额（美元）',
  })
  @IsNumber()
  @IsOptional()
  annualPurchaseValue?: number;

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
    description: '营业执照图片地址',
  })
  @IsUrl()
  @IsOptional()
  businessLicenseUrl?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/office1.jpg', 'https://example.com/office2.jpg'],
    description: '公司照片地址列表',
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  companyPhotosUrls?: string[];

  @ApiPropertyOptional({
    example: 'procurement@company.com',
    description: '企业邮箱',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+86-10-12345678',
    description: '企业联系电话',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://www.company.com',
    description: '企业官网',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    example: '北京市朝阳区建国门外大街1号',
    description: '企业地址',
  })
  @IsString()
  @IsOptional()
  address?: string;
}