import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MultiLangText } from '../types/multilang';

export interface EmailVariable {
  name: string;
  description: string;
  example?: string;
}

@Entity('email_templates')
@Index('idx_email_templates_code', ['code'])
@Index('idx_email_templates_trigger_event', ['triggerEvent'])
export class EmailTemplate extends BaseEntity {
  @Column({ length: 50, unique: true })
  code: string;

  @Column('json')
  name: MultiLangText;

  @Column('json', { nullable: true })
  description?: MultiLangText;

  @Column('json')
  subject: MultiLangText;

  @Column('json')
  body: MultiLangText;

  @Column('json', { nullable: true })
  variables?: EmailVariable[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 100, nullable: true })
  triggerEvent?: string;
}