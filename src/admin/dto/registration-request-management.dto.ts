import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RegistrationRequestStatus } from '../../entities/registration-request.entity';

export class RegistrationRequestQueryDto {
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
    required: false 
  })
  @IsOptional()
  @IsEnum(RegistrationRequestStatus)
  status?: RegistrationRequestStatus;

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
}

export class UpdateRegistrationRequestStatusDto {
  @ApiProperty({ 
    description: '新状态', 
    enum: RegistrationRequestStatus,
    example: RegistrationRequestStatus.IN_PROGRESS
  })
  @IsEnum(RegistrationRequestStatus)
  status: RegistrationRequestStatus;

  @ApiProperty({ description: '进度说明或拒绝原因', required: false })
  @IsOptional()
  @IsString()
  statusNote?: string;

  @ApiProperty({ description: '操作人', example: 'admin' })
  @IsString()
  operatedBy: string;
}

export class RegistrationRequestStatsDto {
  @ApiProperty({ description: '待回复数量' })
  pendingResponse: number;

  @ApiProperty({ description: '进行中数量' })
  inProgress: number;

  @ApiProperty({ description: '已完成数量' })
  completed: number;

  @ApiProperty({ description: '已拒绝数量' })
  declined: number;

  @ApiProperty({ description: '已取消数量' })
  cancelled: number;

  @ApiProperty({ description: '总登记申请数量' })
  total: number;
}