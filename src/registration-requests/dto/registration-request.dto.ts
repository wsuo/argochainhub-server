import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RegistrationRequestStatus } from '../../entities/registration-request.entity';

export class CreateRegistrationRequestDto {
  @ApiProperty({
    description: '供应商企业ID',
    example: 1,
  })
  @IsNumber()
  supplierId: number;

  @ApiProperty({
    description: '产品ID',
    example: 1,
  })
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: '目标国家',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetCountry?: string;

  @ApiProperty({
    description: '是否独家',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;

  @ApiProperty({
    description: '文档要求',
    example: ['COA', 'MSDS', 'GLP'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  docReqs?: string[];

  @ApiProperty({
    description: '样品需求',
    required: false,
  })
  @IsOptional()
  @IsObject()
  sampleReq?: {
    needed: boolean;
    quantity?: number;
    unit?: string;
  };

  @ApiProperty({
    description: '时间要求',
    example: '6个月内',
    required: false,
  })
  @IsOptional()
  @IsString()
  timeline?: string;

  @ApiProperty({
    description: '预算金额',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  budgetAmount?: number;

  @ApiProperty({
    description: '预算货币',
    example: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @ApiProperty({
    description: '其他要求',
    example: '需要提供技术支持',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalRequirements?: string;

  @ApiProperty({
    description: '截止日期',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class QueryRegistrationRequestDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页条数', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: '登记申请单号', required: false })
  @IsOptional()
  @IsString()
  regReqNo?: string;

  @ApiProperty({
    description: '登记申请状态',
    enum: RegistrationRequestStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(RegistrationRequestStatus)
  status?: RegistrationRequestStatus;

  @ApiProperty({ description: '供应商企业ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @ApiProperty({ description: '产品ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productId?: number;

  @ApiProperty({ description: '目标国家', required: false })
  @IsOptional()
  @IsString()
  targetCountry?: string;

  @ApiProperty({ description: '创建开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdStartDate?: string;

  @ApiProperty({ description: '创建结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdEndDate?: string;

  @ApiProperty({
    description: '关键字模糊查询（可匹配登记申请单号、产品名称、目标国家）',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class UpdateRegistrationProgressDto {
  @ApiProperty({
    description: '进度说明',
    example: '已提交初步文档，等待审核',
  })
  @IsString()
  progressNote: string;

  @ApiProperty({
    description: '预计完成时间',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  estimatedCompletionDate?: string;
}

export class RejectRegistrationRequestDto {
  @ApiProperty({
    description: '拒绝原因',
    example: '暂时无法提供该产品的登记服务',
  })
  @IsString()
  rejectReason: string;
}