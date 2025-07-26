import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { Order } from './order.entity';
import { Communication } from './communication.entity';
import { Attachment } from './attachment.entity';
import { Notification } from './notification.entity';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255 })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    nullable: true, 
    comment: '电话号码' 
  })
  phone?: string;

  @Column({ 
    type: 'varchar', 
    length: 500, 
    nullable: true, 
    comment: '头像URL' 
  })
  avatar?: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    comment: '职位/岗位' 
  })
  position?: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    comment: '部门' 
  })
  department?: string;

  @Column({ 
    type: 'date', 
    nullable: true, 
    comment: '入职时间' 
  })
  joinedAt?: Date;

  @Column({ 
    type: 'boolean', 
    default: false, 
    comment: '邮箱是否已验证' 
  })
  emailVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Communication, (communication) => communication.sender)
  communications: Communication[];

  @OneToMany(() => Attachment, (attachment) => attachment.uploadedBy)
  attachments: Attachment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
