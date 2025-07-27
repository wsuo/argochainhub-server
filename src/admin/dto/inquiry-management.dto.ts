import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus } from '../../entities/inquiry.entity';

export class InquiryQueryDto {
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

  @ApiProperty({ description: '询价单号', required: false })
  @IsOptional()
  @IsString()
  inquiryNo?: string;

  @ApiProperty({ 
    description: '询价单状态', 
    enum: InquiryStatus, 
    required: false 
  })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiProperty({ description: '买方企业ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buyerId?: number;

  @ApiProperty({ description: '供应商企业ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @ApiProperty({ description: '创建开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdStartDate?: string;

  @ApiProperty({ description: '创建结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdEndDate?: string;

  @ApiProperty({ description: '关键字搜索（支持询价单号、买方企业名、供应商企业名、产品名称模糊匹配）', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '买方企业名称（模糊匹配）', required: false })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiProperty({ description: '供应商企业名称（模糊匹配）', required: false })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiProperty({ description: '产品名称（模糊匹配）', required: false })
  @IsOptional()
  @IsString()
  productName?: string;
}

export class QuoteDetailsDto {
  @ApiProperty({ description: '总价格', example: 5000.00 })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({ description: '报价有效期 (YYYY-MM-DD)', example: '2024-02-01' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ description: '供应商备注', required: false })
  @IsOptional()
  @IsString()
  supplierRemarks?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ 
    description: '新状态', 
    enum: InquiryStatus,
    example: InquiryStatus.QUOTED
  })
  @IsEnum(InquiryStatus)
  status: InquiryStatus;

  @ApiProperty({ 
    description: '报价详情（当状态为quoted时必填）', 
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuoteDetailsDto)
  @IsObject()
  quoteDetails?: QuoteDetailsDto;

  @ApiProperty({ description: '拒绝原因（当状态为declined时必填）', required: false })
  @IsOptional()
  @IsString()
  declineReason?: string;

  @ApiProperty({ description: '操作人', example: 'admin' })
  @IsString()
  operatedBy: string;
}

export class InquiryStatsDto {
  @ApiProperty({ description: '待报价数量' })
  pendingQuote: number;

  @ApiProperty({ description: '已报价数量' })
  quoted: number;

  @ApiProperty({ description: '已确认数量' })
  confirmed: number;

  @ApiProperty({ description: '已拒绝数量' })
  declined: number;

  @ApiProperty({ description: '已过期数量' })
  expired: number;

  @ApiProperty({ description: '已取消数量' })
  cancelled: number;

  @ApiProperty({ description: '总询价单数量' })
  total: number;
}