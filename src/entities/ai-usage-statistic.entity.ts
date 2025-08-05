import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AiConversation } from './ai-conversation.entity';
import { AiMessage } from './ai-message.entity';

@Entity('ai_usage_statistics')
@Index(['messageId'])
@Index(['conversationId'])
@Index(['createdAt'])
@Index(['totalPrice'])
@Index(['totalTokens'])
export class AiUsageStatistic extends BaseEntity {
  @Column({
    name: 'message_id',
    type: 'varchar',
    length: 36,
    comment: '消息UUID',
  })
  messageId: string;

  @Column({
    name: 'conversation_id',
    type: 'varchar',
    length: 36,
    comment: '会话UUID',
  })
  conversationId: string;

  @Column({
    name: 'prompt_tokens',
    type: 'int',
    default: 0,
    comment: '输入token数',
  })
  promptTokens: number;

  @Column({
    name: 'completion_tokens',
    type: 'int',
    default: 0,
    comment: '输出token数',
  })
  completionTokens: number;

  @Column({
    name: 'total_tokens',
    type: 'int',
    default: 0,
    comment: '总token数',
  })
  totalTokens: number;

  @Column({
    name: 'prompt_unit_price',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: 0,
    comment: '输入token单价',
  })
  promptUnitPrice: number;

  @Column({
    name: 'completion_unit_price',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: 0,
    comment: '输出token单价',
  })
  completionUnitPrice: number;

  @Column({
    name: 'prompt_price',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: 0,
    comment: '输入token费用',
  })
  promptPrice: number;

  @Column({
    name: 'completion_price',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: 0,
    comment: '输出token费用',
  })
  completionPrice: number;

  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: 0,
    comment: '总费用',
  })
  totalPrice: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'USD',
    comment: '货币单位',
  })
  currency: string;

  @Column({
    name: 'price_unit',
    type: 'decimal',
    precision: 10,
    scale: 8,
    default: 0.000001,
    comment: '价格单位',
  })
  priceUnit: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    comment: '延迟时间（秒）',
  })
  latency?: number;

  // 关联关系
  @ManyToOne(() => AiConversation, (conversation) => conversation.usageStatistics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id', referencedColumnName: 'conversationId' })
  conversation: AiConversation;

  @ManyToOne(() => AiMessage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'messageId' })
  message: AiMessage;
}