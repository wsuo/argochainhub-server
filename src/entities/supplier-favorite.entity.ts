import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Company } from './company.entity';

@Entity('supplier_favorites')
@Index(['userId'])
@Index(['supplierId'])
@Index(['createdAt'])
@Unique(['userId', 'supplierId']) // 确保同一用户不能重复收藏同一供应商
export class SupplierFavorite extends BaseEntity {
  @Column({
    name: 'user_id',
    type: 'bigint',
    unsigned: true,
    comment: '用户ID',
  })
  userId: number;

  @Column({
    name: 'supplier_id',
    type: 'bigint',
    unsigned: true,
    comment: '供应商ID（企业ID）',
  })
  supplierId: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: '收藏备注',
  })
  note?: string;

  // 关联关系
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Company;
}