import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AiMessage } from './ai-message.entity';
import { AiWorkflowRun } from './ai-workflow-run.entity';
import { AiUsageStatistic } from './ai-usage-statistic.entity';

export enum UserType {
  USER = 'user',
  ADMIN = 'admin',
  GUEST = 'guest',
}

@Entity('ai_conversations')
@Index(['userId'])
@Index(['guestId'])
@Index(['createdAt'])
@Index(['userType'])
export class AiConversation extends BaseEntity {
  @Column({
    name: 'conversation_id',
    type: 'varchar',
    length: 36,
    unique: true,
    comment: '会话UUID',
  })
  conversationId: string;

  @Column({
    name: 'user_id',
    type: 'int',
    nullable: true,
    comment: '用户ID，可为空（访客）',
  })
  userId?: number;

  @Column({
    name: 'guest_id',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '访客唯一标识（localStorage UUID）',
  })
  guestId?: string;

  @Column({
    name: 'user_type',
    type: 'enum',
    enum: UserType,
    default: UserType.GUEST,
    comment: '用户类型',
  })
  userType: UserType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '会话标题',
  })
  title?: string;

  @Column({
    name: 'user_query',
    type: 'text',
    nullable: true,
    comment: '用户原始提问',
  })
  userQuery?: string;

  @Column({
    name: 'user_inputs',
    type: 'json',
    nullable: true,
    comment: '用户输入参数',
  })
  userInputs?: Record<string, any>;

  @Column({
    name: 'final_answer',
    type: 'text',
    nullable: true,
    comment: 'AI最终回答',
  })
  finalAnswer?: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: '对话持续时间(毫秒)',
  })
  duration?: number;

  @Column({
    name: 'is_active',
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '是否活跃',
  })
  isActive: boolean;

  @Column({
    name: 'total_messages',
    type: 'int',
    default: 0,
    comment: '消息总数',
  })
  totalMessages: number;

  @Column({
    name: 'total_tokens',
    type: 'int',
    default: 0,
    comment: '总token数',
  })
  totalTokens: number;

  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 10,
    scale: 6,
    default: 0,
    comment: '总花费（美元）',
  })
  totalCost: number;

  // 关联关系
  @OneToMany(() => AiMessage, (message) => message.conversation, {
    cascade: true,
  })
  messages: AiMessage[];

  @OneToMany(() => AiWorkflowRun, (workflowRun) => workflowRun.conversation, {
    cascade: true,
  })
  workflowRuns: AiWorkflowRun[];

  @OneToMany(() => AiUsageStatistic, (usageStat) => usageStat.conversation, {
    cascade: true,
  })
  usageStatistics: AiUsageStatistic[];
}