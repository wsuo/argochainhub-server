import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('email_configs')
@Index('idx_email_configs_is_default', ['isDefault'])
export class EmailConfig extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  host: string;

  @Column('int')
  port: number;

  @Column({ default: true })
  secure: boolean;

  @Column({ length: 255 })
  authUser: string;

  @Column({ length: 500 })
  authPass: string;

  @Column({ length: 255 })
  fromEmail: string;

  @Column({ length: 100, nullable: true })
  fromName?: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ default: 60 })
  retryDelay: number;
}