import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Product } from './product.entity';

export enum AttachmentType {
  PRODUCT_IMAGE = 'product_image',
  COMPANY_CERTIFICATE = 'company_certificate', 
  SAMPLE_DOCUMENT = 'sample_document',
  REGISTRATION_DOCUMENT = 'registration_document',
  OTHER = 'other',
}

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimetype: string;

  @Column({ type: 'int', unsigned: true })
  size: number;

  @Column({ length: 500 })
  path: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.OTHER,
  })
  type: AttachmentType;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  relatedId?: number;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  uploadedById: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'relatedId' })
  product?: Product;
}