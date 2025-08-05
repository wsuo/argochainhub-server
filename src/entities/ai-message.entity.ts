import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AiConversation } from './ai-conversation.entity';

export enum MessageType {
  USER_QUERY = 'user_query',
  AI_RESPONSE = 'ai_response',
}

@Entity('ai_messages')
@Index(['conversationId'])
@Index(['workflowRunId'])
@Index(['createdAt'])
@Index(['messageType'])
export class AiMessage extends BaseEntity {
  @Column({
    name: 'message_id',
    type: 'varchar',
    length: 36,
    unique: true,
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
    name: 'task_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '任务ID',
  })
  taskId?: string;

  @Column({
    name: 'workflow_run_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '工作流运行ID',
  })
  workflowRunId?: string;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    comment: '消息类型',
  })
  messageType: MessageType;

  @Column({
    type: 'text',
    nullable: true,
    comment: '消息内容',
  })
  content?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: '元数据信息',
  })
  metadata?: Record<string, any>;

  // 关联关系
  @ManyToOne(() => AiConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id', referencedColumnName: 'conversationId' })
  conversation: AiConversation;
}