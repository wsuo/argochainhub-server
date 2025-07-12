import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsObject,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SampleRequestStatus } from '../../entities/sample-request.entity';

export class SampleRequestQueryDto {
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

  @ApiProperty({ description: '样品申请单号', required: false })
  @IsOptional()
  @IsString()
  sampleReqNo?: string;

  @ApiProperty({ 
    description: '样品申请状态', 
    enum: SampleRequestStatus, 
    required: false 
  })
  @IsOptional()
  @IsEnum(SampleRequestStatus)
  status?: SampleRequestStatus;

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

  @ApiProperty({ description: '产品ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productId?: number;

  @ApiProperty({ description: '创建开始日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdStartDate?: string;

  @ApiProperty({ description: '创建结束日期 (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  createdEndDate?: string;
}

export class TrackingInfoDto {
  @ApiProperty({ description: '承运商', example: 'SF Express' })
  @IsString()
  carrier: string;

  @ApiProperty({ description: '运单号', example: 'SF1234567890' })
  @IsString()
  trackingNumber: string;
}

export class UpdateSampleRequestStatusDto {
  @ApiProperty({ 
    description: '新状态', 
    enum: SampleRequestStatus,
    example: SampleRequestStatus.APPROVED
  })
  @IsEnum(SampleRequestStatus)
  status: SampleRequestStatus;

  @ApiProperty({ 
    description: '运输信息（当状态为shipped时必填）', 
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TrackingInfoDto)
  @IsObject()
  trackingInfo?: TrackingInfoDto;

  @ApiProperty({ description: '拒绝原因（当状态为rejected时必填）', required: false })
  @IsOptional()
  @IsString()
  rejectReason?: string;

  @ApiProperty({ description: '操作人', example: 'admin' })
  @IsString()
  operatedBy: string;
}

export class SampleRequestStatsDto {
  @ApiProperty({ description: '待审核数量' })
  pendingApproval: number;

  @ApiProperty({ description: '已批准数量' })
  approved: number;

  @ApiProperty({ description: '已发货数量' })
  shipped: number;

  @ApiProperty({ description: '已送达数量' })
  delivered: number;

  @ApiProperty({ description: '已拒绝数量' })
  rejected: number;

  @ApiProperty({ description: '已取消数量' })
  cancelled: number;

  @ApiProperty({ description: '总样品申请数量' })
  total: number;
}