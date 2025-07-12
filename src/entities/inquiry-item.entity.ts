import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Inquiry } from './inquiry.entity';
import { Product } from './product.entity';
import { MultiLangText } from '../types/multilang';

@Entity('inquiry_items')
export class InquiryItem extends BaseEntity {
  @Column('decimal', { precision: 15, scale: 3 })
  quantity: number;

  @Column({ length: 50 })
  unit: string;

  @Column({ length: 255, nullable: true })
  packagingReq?: string;

  @Column('json')
  productSnapshot: {
    name: MultiLangText;
    category: MultiLangText;
    formulation: string;
    activeIngredient: MultiLangText;
    content: string;
  };

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  inquiryId: number;

  @ManyToOne(() => Inquiry, (inquiry) => inquiry.items)
  @JoinColumn({ name: 'inquiryId' })
  inquiry: Inquiry;

  @Column({ type: 'bigint', unsigned: true })
  productId: number;

  @ManyToOne(() => Product, (product) => product.inquiryItems)
  @JoinColumn({ name: 'productId' })
  product: Product;
}