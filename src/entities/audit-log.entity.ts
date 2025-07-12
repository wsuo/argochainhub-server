import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AdminUser } from './admin-user.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ length: 255 })
  action: string;

  @Column({ length: 255 })
  targetResource: string;

  @Column({ type: 'bigint', unsigned: true })
  targetId: number;

  @Column('json', { nullable: true })
  details?: {
    before?: object;
    after?: object;
    reason?: string;
  };

  @Column({ length: 45 })
  ipAddress: string;

  // 关联关系
  @Column({ type: 'int', unsigned: true })
  adminUserId: number;

  @ManyToOne(() => AdminUser, (adminUser) => adminUser.auditLogs)
  @JoinColumn({ name: 'adminUserId' })
  adminUser: AdminUser;
}
