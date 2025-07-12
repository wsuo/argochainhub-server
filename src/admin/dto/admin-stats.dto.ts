import { ApiProperty } from '@nestjs/swagger';

export class CompanyTypeStatsDto {
  @ApiProperty({ description: '企业类型' })
  type: string;

  @ApiProperty({ description: '数量' })
  count: number;
}

export class InquiryStatusStatsDto {
  @ApiProperty({ description: '询价状态' })
  status: string;

  @ApiProperty({ description: '数量' })
  count: number;
}

export class AdminStatsDto {
  @ApiProperty({ description: '企业总数' })
  totalCompanies: number;

  @ApiProperty({ description: '待审核企业数' })
  pendingCompanies: number;

  @ApiProperty({ description: '用户总数' })
  totalUsers: number;

  @ApiProperty({ description: '产品总数' })
  totalProducts: number;

  @ApiProperty({ description: '待审核产品数' })
  pendingProducts: number;

  @ApiProperty({ description: '询价单总数' })
  totalInquiries: number;

  @ApiProperty({ description: '订单总数' })
  totalOrders: number;

  @ApiProperty({
    description: '企业类型统计',
    type: [CompanyTypeStatsDto],
  })
  companyTypeStats: CompanyTypeStatsDto[];

  @ApiProperty({
    description: '询价状态统计',
    type: [InquiryStatusStatsDto],
  })
  inquiryStatusStats: InquiryStatusStatsDto[];
}
