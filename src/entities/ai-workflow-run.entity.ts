import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AiConversation } from './ai-conversation.entity';
import { AiMessage } from './ai-message.entity';

export enum WorkflowStatus {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

@Entity('ai_workflow_runs')
@Index(['conversationId'])
@Index(['messageId'])
@Index(['status'])
@Index(['createdAt'])
export class AiWorkflowRun extends BaseEntity {
  @Column({
    name: 'workflow_run_id',
    type: 'varchar',
    length: 36,
    unique: true,
    comment: '工作流运行UUID',
  })
  workflowRunId: string;

  @Column({
    name: 'conversation_id',
    type: 'varchar',
    length: 36,
    comment: '会话UUID',
  })
  conversationId: string;

  @Column({
    name: 'message_id',
    type: 'varchar',
    length: 36,
    comment: '消息UUID',
  })
  messageId: string;

  @Column({
    name: 'workflow_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '工作流ID',
  })
  workflowId?: string;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    comment: '运行状态',
  })
  status: WorkflowStatus;

  @Column({
    type: 'json',
    nullable: true,
    comment: '输出结果',
  })
  outputs?: Record<string, any>;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
    comment: '错误信息',
  })
  errorMessage?: string;

  @Column({
    name: 'elapsed_time',
    type: 'decimal',
    precision: 8,
    scale: 6,
    nullable: true,
    comment: '执行时间（秒）',
  })
  elapsedTime?: number;

  @Column({
    name: 'total_tokens',
    type: 'int',
    default: 0,
    comment: '总token数',
  })
  totalTokens: number;

  @Column({
    name: 'total_steps',
    type: 'int',
    default: 0,
    comment: '总步骤数',
  })
  totalSteps: number;

  @Column({
    name: 'exceptions_count',
    type: 'int',
    default: 0,
    comment: '异常次数',
  })
  exceptionsCount: number;

  @Column({
    name: 'created_by_user_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '创建用户ID',
  })
  createdByUserId?: string;

  @Column({
    name: 'finished_at',
    type: 'timestamp',
    nullable: true,
    comment: '完成时间',
  })
  finishedAt?: Date;

  // 关联关系
  @ManyToOne(() => AiConversation, (conversation) => conversation.workflowRuns, {
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