import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StandardPesticide } from './standard-pesticide.entity';

@Entity('pesticide_price_trends')
@Index(['weekEndDate', 'pesticideId'], { unique: true })
export class PesticidePriceTrend extends BaseEntity {
  @Column({ type: 'date', comment: '周最后日期（如：2025-07-25）' })
  weekEndDate: Date;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 2, 
    comment: '单位价格（元）' 
  })
  unitPrice: number;

  @Column({ 
    type: 'decimal', 
    precision: 8, 
    scale: 4, 
    comment: '人民币美元汇率（1美元=X人民币）' 
  })
  exchangeRate: number;

  @Column({ type: 'bigint', unsigned: true, comment: '标准农药ID' })
  pesticideId: number;

  // 关联关系：多条价格记录对应一个标准农药
  @ManyToOne(() => StandardPesticide, (pesticide) => pesticide.priceHistory)
  @JoinColumn({ name: 'pesticideId' })
  pesticide: StandardPesticide;
}