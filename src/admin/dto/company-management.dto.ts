import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsEmail, IsOptional, IsNotEmpty, IsPhoneNumber, IsObject, IsArray, IsNumber, IsUrl, ValidateIf } from 'class-validator';
import { CompanyType, CompanyStatus, CompanySize } from '../../entities/company.entity';
import { MultiLangText } from '../../types/multilang';

export class CreateCompanyDto {
  @ApiProperty({ description: '企业名称（多语言）' })
  @IsNotEmpty()
  @IsObject()
  name: MultiLangText;

  @ApiProperty({ description: '企业类型', enum: CompanyType })
  @IsEnum(CompanyType)
  type: CompanyType;

  @ApiProperty({ description: '企业状态', enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus = CompanyStatus.ACTIVE;

  @ApiProperty({ description: '企业资料', required: false })
  @IsOptional()
  @IsObject()
  profile?: {
    description?: MultiLangText;
    address?: string;
    phone?: string;
    website?: string;
    certificates?: string[];
  };

  @ApiProperty({ description: '评分', required: false })
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: '是否百强企业', required: false })
  @IsOptional()
  isTop100?: boolean;

  @ApiProperty({ description: '企业邮箱', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '国家代码', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: '业务类别', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessCategories?: string[];

  @ApiProperty({ description: '业务范围（多语言）', required: false })
  @IsOptional()
  @IsObject()
  businessScope?: MultiLangText;

  @ApiProperty({ description: '公司规模', enum: CompanySize, required: false })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @ApiProperty({ description: '主要产品（多语言）', required: false })
  @IsOptional()
  @IsObject()
  mainProducts?: MultiLangText;

  @ApiProperty({ description: '主要供应商（多语言）', required: false })
  @IsOptional()
  @IsObject()
  mainSuppliers?: MultiLangText;

  @ApiProperty({ description: '年进出口额（美元）', required: false })
  @IsOptional()
  @IsNumber()
  annualImportExportValue?: number;

  @ApiProperty({ description: '注册证号', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ description: '税号', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ description: '营业执照图片地址', required: false })
  @IsOptional()
  @ValidateIf((o) => o.businessLicenseUrl !== '' && o.businessLicenseUrl !== null)
  @IsUrl({}, { message: '营业执照图片地址必须是有效的URL' })
  businessLicenseUrl?: string;

  @ApiProperty({ description: '公司照片地址列表', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => o.companyPhotosUrls && o.companyPhotosUrls.length > 0)
  @IsUrl({}, { each: true, message: '公司照片地址必须是有效的URL' })
  companyPhotosUrls?: string[];
}

export class UpdateCompanyDto {
  @ApiProperty({ description: '企业名称（多语言）', required: false })
  @IsOptional()
  @IsObject()
  name?: MultiLangText;

  @ApiProperty({ description: '企业类型', enum: CompanyType, required: false })
  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;

  @ApiProperty({ description: '企业状态', enum: CompanyStatus, required: false })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiProperty({ description: '企业资料', required: false })
  @IsOptional()
  @IsObject()
  profile?: {
    description?: MultiLangText;
    address?: string;
    phone?: string;
    website?: string;
    certificates?: string[];
  };

  @ApiProperty({ description: '评分', required: false })
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: '是否百强企业', required: false })
  @IsOptional()
  isTop100?: boolean;

  @ApiProperty({ description: '企业邮箱', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '国家代码', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: '业务类别', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessCategories?: string[];

  @ApiProperty({ description: '业务范围（多语言）', required: false })
  @IsOptional()
  @IsObject()
  businessScope?: MultiLangText;

  @ApiProperty({ description: '公司规模', enum: CompanySize, required: false })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @ApiProperty({ description: '主要产品（多语言）', required: false })
  @IsOptional()
  @IsObject()
  mainProducts?: MultiLangText;

  @ApiProperty({ description: '主要供应商（多语言）', required: false })
  @IsOptional()
  @IsObject()
  mainSuppliers?: MultiLangText;

  @ApiProperty({ description: '年进出口额（美元）', required: false })
  @IsOptional()
  @IsNumber()
  annualImportExportValue?: number;

  @ApiProperty({ description: '注册证号', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ description: '税号', required: false })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiProperty({ description: '营业执照图片地址', required: false })
  @IsOptional()
  @ValidateIf((o) => o.businessLicenseUrl !== '' && o.businessLicenseUrl !== null)
  @IsUrl({}, { message: '营业执照图片地址必须是有效的URL' })
  businessLicenseUrl?: string;

  @ApiProperty({ description: '公司照片地址列表', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => o.companyPhotosUrls && o.companyPhotosUrls.length > 0)
  @IsUrl({}, { each: true, message: '公司照片地址必须是有效的URL' })
  companyPhotosUrls?: string[];
}