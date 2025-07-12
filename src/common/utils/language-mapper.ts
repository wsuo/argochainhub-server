/**
 * 语言代码映射工具
 * 将系统内部语言代码映射为火山引擎翻译API支持的语言代码
 */

export type SupportedLanguage = 'zh-CN' | 'en' | 'es';
export type VolcLanguageCode = 'zh' | 'en' | 'es';

export const LANGUAGE_MAPPING: Record<SupportedLanguage, VolcLanguageCode> = {
  'zh-CN': 'zh',
  'en': 'en',
  'es': 'es',
};

export const VOLC_TO_SYSTEM_MAPPING: Record<VolcLanguageCode, SupportedLanguage> = {
  'zh': 'zh-CN',
  'en': 'en',
  'es': 'es',
};

/**
 * 将系统语言代码转换为火山引擎语言代码
 */
export function toVolcLanguageCode(systemLang: SupportedLanguage): VolcLanguageCode {
  return LANGUAGE_MAPPING[systemLang];
}

/**
 * 将火山引擎语言代码转换为系统语言代码
 */
export function toSystemLanguageCode(volcLang: VolcLanguageCode): SupportedLanguage {
  return VOLC_TO_SYSTEM_MAPPING[volcLang];
}

/**
 * 检查是否为支持的语言代码
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return lang in LANGUAGE_MAPPING;
}

/**
 * 获取所有支持的语言代码
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(LANGUAGE_MAPPING) as SupportedLanguage[];
}