import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { SupportedLanguage } from '../types/multilang';

/**
 * 多语言查询工具类
 */
export class MultiLangQueryUtil {
  /**
   * 为JSON字段添加多语言搜索条件
   * @param qb QueryBuilder
   * @param fieldName 字段名 (如 'name', 'description')
   * @param searchTerm 搜索词
   * @param language 语言，默认为所有语言
   * @param entityAlias 实体别名，默认为实体名称
   */
  static addMultiLangSearch<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    fieldName: string,
    searchTerm: string,
    language?: SupportedLanguage,
    entityAlias?: string,
  ): SelectQueryBuilder<T> {
    if (!searchTerm) {
      return qb;
    }

    const alias = entityAlias || qb.alias;
    const paramName = `${fieldName}_search`;

    if (language) {
      // 搜索特定语言
      qb.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(${alias}.${fieldName}, '$.${language}')) LIKE :${paramName}`,
        { [paramName]: `%${searchTerm}%` },
      );
    } else {
      // 搜索所有语言
      qb.andWhere(
        `(JSON_UNQUOTE(JSON_EXTRACT(${alias}.${fieldName}, '$."zh-CN"')) LIKE :${paramName} OR ` +
          `JSON_UNQUOTE(JSON_EXTRACT(${alias}.${fieldName}, '$."en"')) LIKE :${paramName} OR ` +
          `JSON_UNQUOTE(JSON_EXTRACT(${alias}.${fieldName}, '$."es"')) LIKE :${paramName})`,
        { [paramName]: `%${searchTerm}%` },
      );
    }

    return qb;
  }

  /**
   * 为JSON字段添加排序
   * @param qb QueryBuilder
   * @param fieldName 字段名
   * @param order 排序方向
   * @param language 语言，默认为中文
   * @param entityAlias 实体别名
   */
  static addMultiLangOrder<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    fieldName: string,
    order: 'ASC' | 'DESC' = 'ASC',
    language: SupportedLanguage = 'zh-CN',
    entityAlias?: string,
  ): SelectQueryBuilder<T> {
    const alias = entityAlias || qb.alias;

    qb.orderBy(
      `JSON_UNQUOTE(JSON_EXTRACT(${alias}.${fieldName}, '$.${language}'))`,
      order,
    );

    return qb;
  }

  /**
   * 获取特定语言的字段值查询片段
   * @param fieldName 字段名
   * @param language 语言
   * @param entityAlias 实体别名
   */
  static getLanguageFieldQuery(
    fieldName: string,
    language: SupportedLanguage,
    entityAlias: string,
  ): string {
    return `JSON_UNQUOTE(JSON_EXTRACT(${entityAlias}.${fieldName}, '$.${language}')) as ${fieldName}_${language.replace('-', '_')}`;
  }
}
