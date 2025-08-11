import { ApiProperty } from '@nestjs/swagger';

export class BuyerInquiryStatsDto {
  @ApiProperty({
    description: '待报价数量',
    example: 3,
  })
  pendingQuoteCount: number;

  @ApiProperty({
    description: '已报价数量',
    example: 8,
  })
  quotedCount: number;

  @ApiProperty({
    description: '已确认数量',
    example: 5,
  })
  confirmedCount: number;

  @ApiProperty({
    description: '已拒绝数量',
    example: 2,
  })
  declinedCount: number;

  @ApiProperty({
    description: '已取消数量',
    example: 1,
  })
  cancelledCount: number;

  @ApiProperty({
    description: '总数量',
    example: 19,
  })
  totalCount: number;
}