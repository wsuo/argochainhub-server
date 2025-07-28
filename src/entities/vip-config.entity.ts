import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { MultiLangText } from '../types/multilang';

export enum VipPlatform {
  SUPPLIER = 'supplier',    // 供应端
  PURCHASER = 'purchaser'   // 采购端
}

export enum VipCurrency {
  USD = 'USD',  // 美元
  CNY = 'CNY'   // 人民币
}

export enum VipLevel {
  PROMOTION = 'promotion',  // 促销版
  BASIC = 'basic',         // 基础版
  ADVANCED = 'advanced'    // 高级版
}

@Entity('vip_configs')
export class VipConfig extends BaseEntity {
  /** VIP配置名称（多语言） */
  @ApiProperty({ description: 'VIP配置名称（多语言）' })
  @Column('json', { comment: 'VIP配置名称（多语言）' })
  name: MultiLangText;

  /** 平台类型 */
  @ApiProperty({ description: '平台类型：supplier-供应端，purchaser-采购端', enum: VipPlatform })
  @Column({
    type: 'enum',
    enum: VipPlatform,
    comment: '平台类型：supplier-供应端，purchaser-采购端'
  })
  platform: VipPlatform;

  /** VIP等级 */
  @ApiProperty({ description: 'VIP等级：promotion-促销版，basic-基础版，advanced-高级版', enum: VipLevel })
  @Column({
    type: 'enum',
    enum: VipLevel,
    comment: 'VIP等级：promotion-促销版，basic-基础版，advanced-高级版'
  })
  level: VipLevel;

  /** 币种 */
  @ApiProperty({ description: '币种：USD-美元，CNY-人民币', enum: VipCurrency })
  @Column({
    type: 'enum',
    enum: VipCurrency,
    comment: '币种：USD-美元，CNY-人民币'
  })
  currency: VipCurrency;

  /** 原价 */
  @ApiProperty({ description: '原价', example: 999.99 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '原价'
  })
  originalPrice: number;

  /** 现价 */
  @ApiProperty({ description: '现价', example: 699.99 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '现价'
  })
  currentPrice: number;

  /** 折扣自动计算 */
  @ApiProperty({ description: '折扣（如：75折）', required: false, example: '70折' })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '折扣（如：75折）'
  })
  discount?: string;

  /** 天数 */
  @ApiProperty({ description: '有效天数', example: 365 })
  @Column({
    type: 'int',
    comment: '有效天数'
  })
  days: number;

  /** 账号额度 */
  @ApiProperty({ description: '账号额度', example: 10 })
  @Column({
    type: 'int',
    default: 0,
    comment: '账号额度'
  })
  accountQuota: number;

  /** 累计最多购买个数 */
  @ApiProperty({ description: '累计最多购买个数，0表示不限制', example: 5 })
  @Column({
    type: 'int',
    default: 0,
    comment: '累计最多购买个数，0表示不限制'
  })
  maxPurchaseCount: number;

  /** 赠送天数（超出365部分） */
  @ApiProperty({ description: '赠送天数（超出365部分）', example: 30 })
  @Column({
    type: 'int',
    default: 0,
    comment: '赠送天数（超出365部分）'
  })
  bonusDays: number;

  /** 采购商查看（供应商）样品管理 */
  @ApiProperty({ description: '采购商查看供应商样品管理次数', example: 100 })
  @Column({
    type: 'int',
    default: 0,
    comment: '采购商查看供应商样品管理次数'
  })
  sampleViewCount: number;

  /** VIP等级（数字表示） */
  @ApiProperty({ description: 'VIP等级数字表示', example: 3 })
  @Column({
    type: 'int',
    default: 0,
    comment: 'VIP等级数字表示'
  })
  vipLevelNumber: number;

  /** 询价管理 */
  @ApiProperty({ description: '询价管理数量', example: 50 })
  @Column({
    type: 'int',
    default: 0,
    comment: '询价管理数量'
  })
  inquiryManagementCount: number;

  /** 登记管理 */
  @ApiProperty({ description: '登记管理数量', example: 20 })
  @Column({
    type: 'int',
    default: 0,
    comment: '登记管理数量'
  })
  registrationManagementCount: number;

  /** 产品发布数（供应商） */
  @ApiProperty({ description: '产品发布数量（供应商）', example: 100 })
  @Column({
    type: 'int',
    default: 0,
    comment: '产品发布数量（供应商）'
  })
  productPublishCount: number;

  /** 查看采购商/供应商次数（根据平台不同含义不同） */
  @ApiProperty({ description: '查看次数：采购端-查看供应商次数，供应端-查看采购商次数', example: 200 })
  @Column({
    type: 'int',
    default: 0,
    comment: '查看次数：采购端-查看供应商次数，供应端-查看采购商次数'
  })
  viewCount: number;

  /** 中文备注 */
  @ApiProperty({ description: '中文备注', required: false })
  @Column('text', { nullable: true, comment: '中文备注' })
  remarkZh?: string;

  /** 英文备注 */
  @ApiProperty({ description: '英文备注', required: false })
  @Column('text', { nullable: true, comment: '英文备注' })
  remarkEn?: string;

  /** 西班牙语备注 */
  @ApiProperty({ description: '西班牙语备注', required: false })
  @Column('text', { nullable: true, comment: '西班牙语备注' })
  remarkEs?: string;

  /** 是否启用 */
  @ApiProperty({ description: '是否启用', default: true })
  @Column({
    type: 'boolean',
    default: true,
    comment: '是否启用'
  })
  isActive: boolean;

  /** 排序 */
  @ApiProperty({ description: '排序值，越小越靠前', default: 0 })
  @Column({
    type: 'int',
    default: 0,
    comment: '排序值，越小越靠前'
  })
  sortOrder: number;

  // 辅助方法
  /** 计算折扣率 */
  calculateDiscountRate(): number {
    if (this.originalPrice === 0) return 0;
    return Math.round((this.currentPrice / this.originalPrice) * 100);
  }

  /** 获取折扣文本 */
  getDiscountText(): string {
    const rate = this.calculateDiscountRate();
    return rate < 100 ? `${rate}折` : '';
  }
}