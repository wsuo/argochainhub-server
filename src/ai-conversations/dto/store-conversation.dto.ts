import { IsString, IsOptional, IsObject, IsArray, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageStatsDto {
  @ApiProperty({ description: '输入token数' })
  promptTokens: number;

  @ApiProperty({ description: '输出token数' })
  completionTokens: number;

  @ApiProperty({ description: '总token数' })
  totalTokens: number;

  @ApiProperty({ description: '总费用' })
  totalPrice: string;

  @ApiProperty({ description: '货币单位', default: 'USD' })
  currency: string;

  @ApiPropertyOptional({ description: '延迟时间（秒）' })
  latency?: number;
}

export class WorkflowDataDto {
  @ApiProperty({ description: '工作流运行ID' })
  id: string;

  @ApiProperty({ description: '工作流ID' })
  workflowId: string;

  @ApiProperty({ description: '状态' })
  status: string;

  @ApiProperty({ description: '输出结果' })
  outputs: Record<string, any>;

  @ApiPropertyOptional({ description: '错误信息' })
  error?: string;

  @ApiProperty({ description: '执行时间（秒）' })
  elapsedTime: number;

  @ApiProperty({ description: '总token数' })
  totalTokens: number;

  @ApiProperty({ description: '总步骤数' })
  totalSteps: number;

  @ApiProperty({ description: '异常次数', default: 0 })
  exceptionsCount: number;

  @ApiPropertyOptional({ description: '创建用户' })
  createdBy?: {
    id: string;
    user: string;
  };

  @ApiProperty({ description: '创建时间（时间戳）' })
  createdAt: number;

  @ApiProperty({ description: '完成时间（时间戳）' })
  finishedAt: number;

  @ApiPropertyOptional({ description: '文件列表' })
  files?: any[];
}

export class StoreCompleteConversationDto {
  @ApiProperty({ description: '会话ID' })
  @IsUUID(4)
  conversationId: string;

  @ApiPropertyOptional({ description: '访客ID' })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiProperty({ description: '用户查询' })
  @IsString()
  userQuery: string;

  @ApiPropertyOptional({ description: '用户输入参数' })
  @IsOptional()
  @IsObject()
  userInputs?: Record<string, any>;

  @ApiPropertyOptional({ description: '用户标识' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ description: 'AI最终回答' })
  @IsOptional()
  @IsString()
  finalAnswer?: string;

  @ApiPropertyOptional({ description: '使用统计' })
  @IsOptional()
  @IsObject()
  usageStats?: UsageStatsDto;

  @ApiPropertyOptional({ description: '工作流数据' })
  @IsOptional()
  @IsObject()
  workflowData?: WorkflowDataDto;

  @ApiPropertyOptional({ description: '流消息列表' })
  @IsOptional()
  @IsArray()
  streamMessages?: any[];

  @ApiPropertyOptional({ description: '对话持续时间（毫秒）' })
  @IsOptional()
  @IsNumber()
  duration?: number;
}