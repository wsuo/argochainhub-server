export interface MultiLangText {
  'zh-CN': string;
  'en': string;
  'es': string;
}

export type SupportedLanguage = 'zh-CN' | 'en' | 'es';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh-CN', 'en', 'es'];

export function createMultiLangText(
  zhCN: string,
  en: string,
  es: string,
): MultiLangText {
  return {
    'zh-CN': zhCN,
    'en': en,
    'es': es,
  };
}

export function getTextByLanguage(
  text: MultiLangText | string,
  language: SupportedLanguage = 'zh-CN',
): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[language] || text['zh-CN'] || '';
}