import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SampleRequestStatus } from '../../entities/sample-request.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

// 创建样品申请DTO
export class CreateSampleRequestDto {
  @ApiProperty({ description: '产品ID', example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ description: '供应商ID', example: 1 })
  @IsNumber()
  supplierId: number;

  @ApiProperty({ description: '数量', example: 5 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: '单位', example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ description: '截止日期', example: '2025-02-28' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ 
    description: '申请详情',
    example: {
      purpose: '产品质量测试',
      shippingAddress: '上海市浦东新区XX路XX号',
      shippingMethod: 'express_delivery',
      willingnessToPay: { paid: true, amount: 500 }
    }
  })
  @IsObject()
  details: {
    purpose?: string;
    shippingAddress?: string;
    shippingMethod?: string;
    willingnessToPay?: {
      paid: boolean;
      amount?: number;
    };
  };
}

// 查询样品申请列表DTO
export class GetSampleRequestsDto extends PaginationDto {
  @ApiProperty({ description: '状态筛选', enum: SampleRequestStatus, required: false })
  @IsOptional()
  @IsEnum(SampleRequestStatus)
  status?: SampleRequestStatus;

  @ApiProperty({ description: '供应商ID筛选', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @ApiProperty({ description: '产品分类筛选', required: false })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '关键词搜索', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '排序字段', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: '排序方向', required: false, default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// 取消样品申请DTO
export class CancelSampleRequestDto {
  @ApiProperty({ description: '取消原因', example: '计划变更，暂时不需要样品' })
  @IsString()
  reason: string;
}

// 确认收货DTO
export class ConfirmDeliveryDto {
  @ApiProperty({ description: '收货时间', example: '2025-01-27T10:00:00Z' })
  @IsDateString()
  receivedAt: string;

  @ApiProperty({ 
    description: '收货状态', 
    example: 'good',
    enum: ['good', 'damaged', 'partial']
  })
  @IsString()
  condition: 'good' | 'damaged' | 'partial';

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '收货照片', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

// 评价样品DTO
export class EvaluateSampleDto {
  @ApiProperty({ description: '总体评分', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  rating: number;

  @ApiProperty({ description: '质量评分', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  qualityRating: number;

  @ApiProperty({ description: '包装评分', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  packagingRating: number;

  @ApiProperty({ description: '配送评分', example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  deliveryRating: number;

  @ApiProperty({ description: '评价内容', example: '样品质量很好，完全符合预期' })
  @IsString()
  comment: string;

  @ApiProperty({ description: '是否推荐', example: true })
  @IsBoolean()
  wouldRecommend: boolean;
}

// 供应商批准申请DTO
export class ApproveSampleRequestDto {
  @ApiProperty({ description: '批准备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '预计发货日期', example: '2025-01-30' })
  @IsDateString()
  estimatedShipDate: string;
}

// 供应商拒绝申请DTO
export class RejectSampleRequestDto {
  @ApiProperty({ description: '拒绝原因', example: '库存不足，暂时无法提供样品' })
  @IsString()
  reason: string;
}

// 供应商发货DTO
export class ShipSampleRequestDto {
  @ApiProperty({ description: '承运商', example: '顺丰快递' })
  @IsString()
  carrier: string;

  @ApiProperty({ description: '运单号', example: 'SF1234567890' })
  @IsString()
  trackingNumber: string;

  @ApiProperty({ description: '发货备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}