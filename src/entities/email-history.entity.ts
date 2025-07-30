import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmailTemplate } from './email-template.entity';
import { EmailConfig } from './email-config.entity';
import { SupportedLanguage } from '../types/multilang';

export enum EmailStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRY = 'retry',
}

@Entity('email_histories')
@Index('idx_email_histories_status', ['status'])
@Index('idx_email_histories_related', ['relatedType', 'relatedId'])
@Index('idx_email_histories_created_at', ['createdAt'])
export class EmailHistory extends BaseEntity {
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  templateId?: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  configId?: number;

  @Column({ length: 255 })
  toEmail: string;

  @Column({ length: 100, nullable: true })
  toName?: string;

  @Column('json', { nullable: true })
  ccEmails?: string[];

  @Column('json', { nullable: true })
  bccEmails?: string[];

  @Column({ length: 500 })
  subject: string;

  @Column('text')
  body: string;

  @Column('json', { nullable: true })
  variables?: Record<string, any>;

  @Column({ length: 10, default: 'zh-CN' })
  language: SupportedLanguage;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column({ length: 50, nullable: true })
  relatedType?: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  relatedId?: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  createdBy?: number;

  // 关联关系
  @ManyToOne(() => EmailTemplate, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: EmailTemplate;

  @ManyToOne(() => EmailConfig, { nullable: true })
  @JoinColumn({ name: 'configId' })
  config?: EmailConfig;
}