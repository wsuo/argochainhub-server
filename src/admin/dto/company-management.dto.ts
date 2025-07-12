import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsEmail, IsOptional, IsNotEmpty, IsPhoneNumber, IsObject } from 'class-validator';
import { CompanyType, CompanyStatus } from '../../entities/company.entity';
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
}