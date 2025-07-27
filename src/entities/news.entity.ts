import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MultiLangText } from '../types/multilang';

@Entity('news')
@Index('IDX_NEWS_CATEGORY', ['category'])
@Index('IDX_NEWS_PUBLISHED', ['isPublished'])
@Index('IDX_NEWS_SORT', ['sortOrder'])
@Index('IDX_NEWS_PUBLISHED_AT', ['publishedAt'])
export class News extends BaseEntity {
  /** 新闻标题（多语言） */
  @Column('json', { comment: '新闻标题（多语言）' })
  title: MultiLangText;

  /** 新闻内容（多语言） */
  @Column('json', { comment: '新闻内容（多语言）' })
  content: MultiLangText;

  /** 新闻类别（字典值） */
  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    comment: '新闻类别（字典值）' 
  })
  category?: string;

  /** 封面图URL */
  @Column({ 
    type: 'varchar', 
    length: 500, 
    nullable: true, 
    comment: '封面图URL' 
  })
  coverImage?: string;

  /** 排序字段 */
  @Column({ 
    type: 'int', 
    default: 0, 
    comment: '排序字段' 
  })
  sortOrder: number;

  /** 是否发布 */
  @Column({ 
    type: 'boolean', 
    default: false, 
    comment: '是否发布' 
  })
  isPublished: boolean;

  /** 发布时间 */
  @Column({ 
    type: 'datetime', 
    nullable: true, 
    comment: '发布时间' 
  })
  publishedAt?: Date;

  /** 浏览次数 */
  @Column({ 
    type: 'int', 
    default: 0, 
    comment: '浏览次数' 
  })
  viewCount: number;

  // 辅助方法
  /** 发布新闻 */
  publish(): void {
    this.isPublished = true;
    this.publishedAt = new Date();
  }

  /** 取消发布 */
  unpublish(): void {
    this.isPublished = false;
    this.publishedAt = undefined;
  }

  /** 增加浏览次数 */
  incrementViewCount(): void {
    this.viewCount += 1;
  }
}