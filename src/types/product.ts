import { MultiLangText } from './multilang';

/**
 * 有效成分接口
 */
export interface ActiveIngredient {
  /** 有效成分名称（多语言） */
  name: MultiLangText;
  /** 有效成分含量 */
  content: string;
}

/**
 * 产品详细信息扩展
 */
export interface ProductDetails {
  /** 产品说明 */
  description?: string;
  /** 产品品类 */
  productCategory?: string;
  /** 备注 */
  remarks?: string;
  /** 出口限制国家列表 */
  exportRestrictedCountries?: string[];
  /** 其他扩展信息 */
  [key: string]: any;
}

/**
 * 毒性等级枚举（对应字典值）
 */
export enum ToxicityLevel {
  SLIGHTLY_TOXIC = 1,              // 微毒
  LOWLY_TOXIC = 2,                 // 低毒
  MODERATELY_TOXIC = 3,            // 中等毒
  HIGHLY_TOXIC = 4,                // 高毒
  EXTREMELY_TOXIC = 5,             // 剧毒
  SLIGHTLY_TOXIC_HIGH_TECH = 6,    // 微毒(原药高毒)
  LOWLY_TOXIC_HIGH_TECH = 8,       // 低毒(原药高毒)
  LOWLY_TOXIC_EXTREME_TECH = 9,    // 低毒(原药剧毒)
  MODERATELY_TOXIC_HIGH_TECH = 10, // 中等毒(原药高毒)
  MODERATELY_TOXIC_EXTREME_TECH = 11, // 中等毒(原药剧毒)
}

/**
 * 语义化毒性等级枚举（前端友好）
 */
export enum ToxicityLevelNames {
  LOW = ToxicityLevel.LOWLY_TOXIC,          // 低毒
  MEDIUM = ToxicityLevel.MODERATELY_TOXIC,  // 中等毒
  HIGH = ToxicityLevel.HIGHLY_TOXIC,        // 高毒
  ACUTE = ToxicityLevel.EXTREMELY_TOXIC,    // 剧毒
}

/**
 * 将语义化毒性等级转换为数字枚举值
 */
export function convertToxicityLevel(value: string | number): ToxicityLevel | undefined {
  if (typeof value === 'number') {
    return Object.values(ToxicityLevel).includes(value as ToxicityLevel) ? value as ToxicityLevel : undefined;
  }
  
  const upperValue = value.toUpperCase();
  switch (upperValue) {
    case 'LOW':
      return ToxicityLevel.LOWLY_TOXIC;
    case 'MEDIUM':
      return ToxicityLevel.MODERATELY_TOXIC;
    case 'HIGH':
      return ToxicityLevel.HIGHLY_TOXIC;
    case 'ACUTE':
      return ToxicityLevel.EXTREMELY_TOXIC;
    default:
      // 尝试直接解析为数字
      const numValue = parseInt(value);
      return Object.values(ToxicityLevel).includes(numValue as ToxicityLevel) ? numValue as ToxicityLevel : undefined;
  }
}

/**
 * 产品状态枚举
 */
export enum ProductStatus {
  DRAFT = 'draft',                   // 草稿
  PENDING_REVIEW = 'pending_review', // 待审核
  ACTIVE = 'active',                 // 已上架
  INACTIVE = 'inactive',             // 已下架
  REJECTED = 'rejected',             // 审核拒绝
  ARCHIVED = 'archived',             // 已归档
}