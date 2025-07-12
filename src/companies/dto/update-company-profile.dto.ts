import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString, MaxLength } from 'class-validator';
import { MultiLangText } from '../../types/multilang';

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional({
    example: {
      description: {
        'zh-CN': '专业从事农化产品采购的大型企业',
        'en': 'Large enterprise specializing in agrochemical procurement',
        'es': 'Gran empresa especializada en adquisiciones agroquímicas'
      },
      address: '北京市朝阳区农业科技园区88号',
      phone: '010-12345678',
      website: 'https://example.com',
      certificates: ['农药经营许可证', 'ISO9001质量管理体系认证']
    }
  })
  @IsOptional()
  @IsObject()
  profile?: {
    description?: MultiLangText;
    address?: string;
    phone?: string;
    website?: string;
    certificates?: string[];
  };
}