import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DictionaryCategory } from './dictionary-category.entity';
import { MultiLangText } from '../types/multilang';

@Entity('dictionary_items')
export class DictionaryItem extends BaseEntity {
  @Column({ length: 100 })
  code: string;

  @Column('json')
  name: MultiLangText;

  @Column('json', { nullable: true })
  description?: MultiLangText;

  @Column('json', { nullable: true })
  extraData?: {
    iso2?: string;        // 国家两位ISO代码
    iso3?: string;        // 国家三位ISO代码
    countryCode?: string; // 电话区号
    continent?: string;   // 所属大洲
    flagIcon?: string;    // flag图标路径
    [key: string]: any;   // 其他扩展数据
  };

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parentId?: number;

  // 关联关系
  @Column({ type: 'bigint', unsigned: true })
  categoryId: number;

  @ManyToOne(() => DictionaryCategory, (category) => category.items)
  @JoinColumn({ name: 'categoryId' })
  category: DictionaryCategory;

  @ManyToOne(() => DictionaryItem, (item) => item.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: DictionaryItem;

  @OneToMany(() => DictionaryItem, (item) => item.parent)
  children: DictionaryItem[];
}