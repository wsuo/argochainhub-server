import { 
  IsEnum, 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  ValidateNested,
  Min,
  Max,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultiLangText } from '../../types/multilang';
import { VipPlatform, VipCurrency, VipLevel } from '../../entities/vip-config.entity';

export class CreateVipConfigDto {
  @ApiProperty({ 
    description: 'VIP配置名称（多语言）',
    example: {
      'zh-CN': '高级版',
      'en': 'Advanced Edition',
      'es': 'Edición Avanzada'
    }
  })
  @IsNotEmpty()
  @IsObject()
  name: MultiLangText;

  @ApiProperty({ 
    description: '平台类型',
    enum: VipPlatform,
    example: VipPlatform.SUPPLIER
  })
  @IsNotEmpty()
  @IsEnum(VipPlatform)
  platform: VipPlatform;

  @ApiProperty({ 
    description: 'VIP等级',
    enum: VipLevel,
    example: VipLevel.ADVANCED
  })
  @IsNotEmpty()
  @IsEnum(VipLevel)
  level: VipLevel;

  @ApiProperty({ 
    description: '币种',
    enum: VipCurrency,
    example: VipCurrency.USD
  })
  @IsNotEmpty()
  @IsEnum(VipCurrency)
  currency: VipCurrency;

  @ApiProperty({ 
    description: '原价',
    example: 999.99
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiProperty({ 
    description: '现价',
    example: 699.99
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  currentPrice: number;

  @ApiPropertyOptional({ 
    description: '折扣',
    example: '70折'
  })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({ 
    description: '有效天数',
    example: 365
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  days: number;

  @ApiProperty({ 
    description: '账号额度',
    example: 10
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  accountQuota: number;

  @ApiProperty({ 
    description: '累计最多购买个数，0表示不限制',
    example: 5
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  maxPurchaseCount: number;

  @ApiProperty({ 
    description: '赠送天数（超出365部分）',
    example: 30
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  bonusDays: number;

  @ApiProperty({ 
    description: '采购商查看供应商样品管理次数',
    example: 100
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  sampleViewCount: number;

  @ApiProperty({ 
    description: 'VIP等级数字表示',
    example: 3
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  vipLevelNumber: number;

  @ApiProperty({ 
    description: '询价管理数量',
    example: 50
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  inquiryManagementCount: number;

  @ApiProperty({ 
    description: '登记管理数量',
    example: 20
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  registrationManagementCount: number;

  @ApiProperty({ 
    description: '产品发布数量（供应商）',
    example: 100
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  productPublishCount: number;

  @ApiProperty({ 
    description: '查看次数：采购端-查看供应商次数，供应端-查看采购商次数',
    example: 200
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  viewCount: number;

  @ApiPropertyOptional({ 
    description: '中文备注'
  })
  @IsOptional()
  @IsString()
  remarkZh?: string;

  @ApiPropertyOptional({ 
    description: '英文备注'
  })
  @IsOptional()
  @IsString()
  remarkEn?: string;

  @ApiPropertyOptional({ 
    description: '西班牙语备注'
  })
  @IsOptional()
  @IsString()
  remarkEs?: string;

  @ApiPropertyOptional({ 
    description: '是否启用',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: '排序值，越小越靠前',
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdateVipConfigDto {
  @ApiPropertyOptional({ 
    description: 'VIP配置名称（多语言）',
    example: {
      'zh-CN': '高级版',
      'en': 'Advanced Edition',
      'es': 'Edición Avanzada'
    }
  })
  @IsOptional()
  @IsObject()
  name?: MultiLangText;

  @ApiPropertyOptional({ 
    description: '平台类型',
    enum: VipPlatform
  })
  @IsOptional()
  @IsEnum(VipPlatform)
  platform?: VipPlatform;

  @ApiPropertyOptional({ 
    description: 'VIP等级',
    enum: VipLevel
  })
  @IsOptional()
  @IsEnum(VipLevel)
  level?: VipLevel;

  @ApiPropertyOptional({ 
    description: '币种',
    enum: VipCurrency
  })
  @IsOptional()
  @IsEnum(VipCurrency)
  currency?: VipCurrency;

  @ApiPropertyOptional({ 
    description: '原价'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ 
    description: '现价'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @ApiPropertyOptional({ 
    description: '折扣'
  })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiPropertyOptional({ 
    description: '有效天数'
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;

  @ApiPropertyOptional({ 
    description: '账号额度'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accountQuota?: number;

  @ApiPropertyOptional({ 
    description: '累计最多购买个数，0表示不限制'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPurchaseCount?: number;

  @ApiPropertyOptional({ 
    description: '赠送天数（超出365部分）'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusDays?: number;

  @ApiPropertyOptional({ 
    description: '采购商查看供应商样品管理次数'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sampleViewCount?: number;

  @ApiPropertyOptional({ 
    description: 'VIP等级数字表示'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vipLevelNumber?: number;

  @ApiPropertyOptional({ 
    description: '询价管理数量'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inquiryManagementCount?: number;

  @ApiPropertyOptional({ 
    description: '登记管理数量'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationManagementCount?: number;

  @ApiPropertyOptional({ 
    description: '产品发布数量（供应商）'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productPublishCount?: number;

  @ApiPropertyOptional({ 
    description: '查看次数：采购端-查看供应商次数，供应端-查看采购商次数'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  viewCount?: number;

  @ApiPropertyOptional({ 
    description: '中文备注'
  })
  @IsOptional()
  @IsString()
  remarkZh?: string;

  @ApiPropertyOptional({ 
    description: '英文备注'
  })
  @IsOptional()
  @IsString()
  remarkEn?: string;

  @ApiPropertyOptional({ 
    description: '西班牙语备注'
  })
  @IsOptional()
  @IsString()
  remarkEs?: string;

  @ApiPropertyOptional({ 
    description: '是否启用'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: '排序值，越小越靠前'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class VipConfigQueryDto {
  @ApiPropertyOptional({ 
    description: '平台类型',
    enum: VipPlatform
  })
  @IsOptional()
  @IsEnum(VipPlatform)
  platform?: VipPlatform;

  @ApiPropertyOptional({ 
    description: 'VIP等级',
    enum: VipLevel
  })
  @IsOptional()
  @IsEnum(VipLevel)
  level?: VipLevel;

  @ApiPropertyOptional({ 
    description: '币种',
    enum: VipCurrency
  })
  @IsOptional()
  @IsEnum(VipCurrency)
  currency?: VipCurrency;

  @ApiPropertyOptional({ 
    description: '是否启用'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: '关键字搜索（搜索名称、备注）'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ 
    description: '页码',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: '每页数量',
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}