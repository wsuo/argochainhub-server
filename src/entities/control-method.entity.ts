import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';
import { MultiLangText } from '../types/multilang';

@Entity('control_methods')
export class ControlMethod extends BaseEntity {
  // ==================== 关联关系 ====================
  
  /** 产品ID（农药ID） */
  @Column({ type: 'bigint', unsigned: true, comment: '产品ID（农药ID）' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // ==================== 防治方法信息 ====================
  
  /** 目标作物（多语言） */
  @Column('json', { comment: '目标作物（多语言）' })
  targetCrop: MultiLangText;

  /** 病虫害（多语言） */
  @Column('json', { comment: '病虫害（多语言）' })
  pestDisease: MultiLangText;

  /** 施用方法（多语言） */
  @Column('json', { comment: '施用方法（多语言）' })
  applicationMethod: MultiLangText;

  /** 用量（多语言） */
  @Column('json', { comment: '用量（多语言）' })
  dosage: MultiLangText;

  // ==================== 附加信息 ====================
  
  /** 排序顺序 */
  @Column({ 
    type: 'int', 
    default: 0, 
    comment: '排序顺序' 
  })
  sortOrder: number;

  /** 是否启用 */
  @Column({ 
    type: 'boolean', 
    default: true, 
    comment: '是否启用' 
  })
  isActive: boolean;

  /** 备注 */
  @Column({ 
    type: 'text', 
    nullable: true, 
    comment: '备注' 
  })
  remarks?: string;
}