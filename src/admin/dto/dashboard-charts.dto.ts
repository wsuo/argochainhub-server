import { ApiProperty } from '@nestjs/swagger';

export class UserGrowthDataDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '新增用户数' })
  newUsers: number;

  @ApiProperty({ description: '累计用户数' })
  totalUsers: number;
}

export class CompanyRegistrationDataDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '新增企业数' })
  newCompanies: number;

  @ApiProperty({ description: '累计企业数' })
  totalCompanies: number;
}

export class RevenueDataDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '收入金额' })
  revenue: number;

  @ApiProperty({ description: '订单数量' })
  orderCount: number;
}

export class InquiryTrendDataDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '询价单数量' })
  inquiryCount: number;

  @ApiProperty({ description: '成功匹配数量' })
  matchedCount: number;
}

export class ProductCategoryStatsDto {
  @ApiProperty({ description: '产品分类' })
  category: string;

  @ApiProperty({ description: '产品数量' })
  count: number;

  @ApiProperty({ description: '占比百分比' })
  percentage: number;
}

export class DashboardChartsDto {
  @ApiProperty({ description: '用户增长数据', type: [UserGrowthDataDto] })
  userGrowth: UserGrowthDataDto[];

  @ApiProperty({
    description: '企业注册数据',
    type: [CompanyRegistrationDataDto],
  })
  companyRegistration: CompanyRegistrationDataDto[];

  @ApiProperty({ description: '收入数据', type: [RevenueDataDto] })
  revenue: RevenueDataDto[];

  @ApiProperty({ description: '询价趋势数据', type: [InquiryTrendDataDto] })
  inquiryTrend: InquiryTrendDataDto[];

  @ApiProperty({ description: '产品分类统计', type: [ProductCategoryStatsDto] })
  productCategoryStats: ProductCategoryStatsDto[];
}
