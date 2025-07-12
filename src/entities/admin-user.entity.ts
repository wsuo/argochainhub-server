import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, unique: true })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255 })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  // 关联关系
  @OneToMany(() => AuditLog, (auditLog) => auditLog.adminUser)
  auditLogs: AuditLog[];
}
