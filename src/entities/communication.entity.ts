import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum RelatedService {
  INQUIRY = 'inquiry',
  SAMPLE = 'sample',
  REGISTRATION = 'registration',
}

@Entity('communications')
export class Communication extends BaseEntity {
  @Column({
    type: 'enum',
    enum: RelatedService,
  })
  relatedService: RelatedService;

  @Column({ type: 'bigint', unsigned: true })
  relatedId: number;

  @Column('text')
  message: string;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  senderId: number;

  @ManyToOne(() => User, (user) => user.communications)
  @JoinColumn({ name: 'senderId' })
  sender: User;
}
