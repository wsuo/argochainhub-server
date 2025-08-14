import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class PopularQueriesDto {
  @ApiPropertyOptional({ description: '返回热门问题数量', default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '最小提问次数', default: 2, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minCount?: number = 2;

  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '用户类型', enum: ['user', 'guest'] })
  @IsOptional()
  @IsString()
  userType?: string;
}

export class PopularQueryItemDto {
  @ApiPropertyOptional({ description: '用户查询内容' })
  query: string;

  @ApiPropertyOptional({ description: '提问次数' })
  count: number;

  @ApiPropertyOptional({ description: '最近提问时间' })
  latestDate: string;

  @ApiPropertyOptional({ description: '占总提问比例（%）' })
  percentage: number;
}

export class PopularQueriesResponseDto {
  @ApiPropertyOptional({ description: '热门问题列表', type: [PopularQueryItemDto] })
  data: PopularQueryItemDto[];

  @ApiPropertyOptional({ description: '总查询数' })
  totalQueries: number;

  @ApiPropertyOptional({ description: '统计时间范围' })
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
}