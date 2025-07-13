import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DictionaryItem } from './dictionary-item.entity';
import { MultiLangText } from '../types/multilang';

@Entity('dictionary_categories')
export class DictionaryCategory extends BaseEntity {
  @Column({ unique: true, length: 100 })
  code: string;

  @Column('json')
  name: MultiLangText;

  @Column('json', { nullable: true })
  description?: MultiLangText;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  // 关联关系
  @OneToMany(() => DictionaryItem, (item) => item.category)
  items: DictionaryItem[];
}