import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../../entities/ai-conversation.entity';

export class ConversationStatsDto {
  @ApiPropertyOptional({ description: '页码', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '开始日期', example: '2025-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2025-01-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: '用户类型', 
    enum: UserType,
    enumName: 'UserType'
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class DailyStatsDto {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '对话数量' })
  conversations: number;

  @ApiProperty({ description: '消息数量' })
  messages: number;

  @ApiProperty({ description: 'Token数量' })
  tokens: number;

  @ApiProperty({ description: '费用' })
  cost: number;
}

export class ConversationStatsResponseDto {
  @ApiProperty({ description: '总对话数' })
  totalConversations: number;

  @ApiProperty({ description: '总消息数' })
  totalMessages: number;

  @ApiProperty({ description: '总Token数' })
  totalTokens: number;

  @ApiProperty({ description: '总费用' })
  totalCost: number;

  @ApiProperty({ description: '货币单位', default: 'USD' })
  currency: string;

  @ApiProperty({ description: '日统计', type: [DailyStatsDto] })
  dailyStats: DailyStatsDto[];
}