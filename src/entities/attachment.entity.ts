import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum RelatedService {
  COMPANY_PROFILE = 'company_profile',
  INQUIRY = 'inquiry',
  SAMPLE = 'sample',
  REGISTRATION = 'registration',
  COMMUNICATION = 'communication',
}

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({
    type: 'enum',
    enum: RelatedService,
  })
  relatedService: RelatedService;

  @Column({ type: 'bigint', unsigned: true })
  relatedId: number;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('int')
  fileSize: number;

  @Column({ length: 100 })
  fileType: string;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  uploaderId: number;

  @ManyToOne(() => User, (user) => user.attachments)
  @JoinColumn({ name: 'uploaderId' })
  uploader: User;
}