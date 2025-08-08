import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsArray, IsNumber } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InquiryStatus } from '../../entities/inquiry.entity';

export class SupplierQuoteSearchDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: [
      InquiryStatus.PENDING_QUOTE,
      InquiryStatus.QUOTED, 
      InquiryStatus.CONFIRMED,
      InquiryStatus.DECLINED,
      InquiryStatus.CANCELLED
    ],
    description: '询价状态筛选',
  })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiPropertyOptional({
    description: '关键词搜索，支持询价单号、采购商公司名称、产品名称、买方备注等模糊搜索',
    example: '阿维菌素',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '开始日期',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期', 
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class QuoteStatsDto {
  @ApiProperty({
    description: '待报价数量',
    example: 5,
  })
  pendingQuoteCount: number;

  @ApiProperty({
    description: '已报价数量',
    example: 12,
  })
  quotedCount: number;

  @ApiProperty({
    description: '已确认数量',
    example: 8,
  })
  confirmedCount: number;

  @ApiProperty({
    description: '已拒绝数量',
    example: 3,
  })
  declinedCount: number;

  @ApiProperty({
    description: '总数量',
    example: 28,
  })
  totalCount: number;

  @ApiProperty({
    description: '本月报价数量',
    example: 15,
  })
  monthlyQuoteCount: number;

  @ApiProperty({
    description: '报价成功率',
    example: '66.7%',
  })
  successRate: string;
}

export class BatchUpdateQuoteDto {
  @ApiProperty({
    description: '询价单ID列表',
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  inquiryIds: number[];

  @ApiProperty({
    description: '批量操作类型',
    enum: ['decline', 'update_priority'],
  })
  @IsEnum(['decline', 'update_priority'])
  action: string;

  @ApiPropertyOptional({
    description: '拒绝原因（当action为decline时必填）',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: '优先级（当action为update_priority时必填）',
    enum: ['low', 'normal', 'high', 'urgent'],
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: string;
}