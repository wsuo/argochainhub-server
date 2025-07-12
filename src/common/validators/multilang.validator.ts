import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { MultiLangText } from '../../types/multilang';
import { getSupportedLanguages, isSupportedLanguage } from '../utils/language-mapper';

/**
 * 验证多语言文本字段的装饰器
 * 确保至少包含zh-CN字段且非空，所有提供的语言文本都不为空
 */
export function IsValidMultiLangText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidMultiLangText',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Multi-language text must contain at least zh-CN field and all provided language texts must be non-empty',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          // 检查是否为对象
          if (!value || typeof value !== 'object') {
            return false;
          }

          const multiLangText = value as MultiLangText;

          // 检查是否包含zh-CN字段且非空
          if (!multiLangText['zh-CN'] || typeof multiLangText['zh-CN'] !== 'string' || multiLangText['zh-CN'].trim() === '') {
            return false;
          }

          // 检查所有提供的语言字段
          const supportedLanguages = getSupportedLanguages();
          for (const [lang, text] of Object.entries(multiLangText)) {
            // 检查语言代码是否支持
            if (!isSupportedLanguage(lang)) {
              return false;
            }

            // 检查文本是否为字符串且非空
            if (typeof text !== 'string' || text.trim() === '') {
              return false;
            }
          }

          return true;
        },
      },
    });
  };
}

/**
 * 验证可选的多语言文本字段
 * 如果提供了值，则必须符合多语言文本格式
 */
export function IsOptionalMultiLangText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOptionalMultiLangText',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Optional multi-language text must be valid format if provided',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          // 如果值为undefined或null，则通过验证（可选字段）
          if (value === undefined || value === null) {
            return true;
          }

          // 如果提供了值，则使用IsValidMultiLangText的验证逻辑
          if (!value || typeof value !== 'object') {
            return false;
          }

          const multiLangText = value as MultiLangText;

          // 对于可选字段，不强制要求zh-CN，但如果提供了任何语言，都必须有效
          const supportedLanguages = getSupportedLanguages();
          const providedLanguages = Object.keys(multiLangText);

          // 至少要提供一个支持的语言
          if (providedLanguages.length === 0) {
            return false;
          }

          for (const [lang, text] of Object.entries(multiLangText)) {
            // 检查语言代码是否支持
            if (!isSupportedLanguage(lang)) {
              return false;
            }

            // 检查文本是否为字符串且非空
            if (typeof text !== 'string' || text.trim() === '') {
              return false;
            }
          }

          return true;
        },
      },
    });
  };
}