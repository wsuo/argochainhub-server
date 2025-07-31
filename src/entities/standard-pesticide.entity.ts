import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MultiLangText } from '../types/multilang';
import { PesticidePriceTrend } from './pesticide-price-trend.entity';

@Entity('standard_pesticides')
export class StandardPesticide extends BaseEntity {
  @Column({ length: 50, comment: '产品类别（字典值，来源：product_category）' })
  category: string;

  @Column({ length: 50, comment: '剂型（字典值，来源：formulation）' })
  formulation: string;

  @Column('json', { comment: '产品名称（多语言）' })
  productName: MultiLangText;

  @Column({ length: 100, comment: '含量规格' })
  concentration: string;

  @Column({ default: true, comment: '是否显示' })
  isVisible: boolean;

  // 关联关系：一个标准农药可以有多条价格走势记录
  @OneToMany(() => PesticidePriceTrend, (priceTrend) => priceTrend.pesticide)
  priceHistory: PesticidePriceTrend[];
}