import { Injectable } from '@nestjs/common';
import { countries } from 'countries-list';
import { DictionaryService } from './dictionary.service';
import { MultiLangText } from '../../types/multilang';

interface CountryInfo {
  name: string;
  native: string;
  capital: string;
  continent: string;
  phone: string[];
}

@Injectable()
export class CountryDictionaryService {
  constructor(private readonly dictionaryService: DictionaryService) {}

  async initializeCountries(): Promise<void> {
    try {
      // 检查是否已经初始化过国家数据
      const existingCountries = await this.dictionaryService.getDictionaryByCode('countries');
      if (existingCountries.length > 0) {
        console.log('Countries already initialized, skipping...');
        return;
      }

      // 准备国家数据
      const countryItems = Object.entries(countries as any).map(
        ([code, info]: [string, any], index) => ({
          code: code.toLowerCase(),
          name: {
            'zh-CN': this.getChineseName(code, info.name),
            en: info.name,
            es: info.name, // 可以后续添加西班牙语翻译
          } as MultiLangText,
          description: {
            'zh-CN': `${this.getChineseName(code, info.name)}，首都：${info.capital}`,
            en: `${info.name}, Capital: ${info.capital}`,
            es: `${info.name}, Capital: ${info.capital}`,
          } as MultiLangText,
          extraData: {
            iso2: code,
            iso3: code, // countries-list 使用 ISO2，这里保持一致
            countryCode: info.phone && info.phone[0] ? `+${info.phone[0]}` : '',
            continent: info.continent,
            flagIcon: info.emoji || '🏳️',
            capital: info.capital,
            native: info.native,
          },
          isSystem: true,
          isActive: this.isActiveCountry(code), // 只激活常用国家
          sortOrder: this.getCountrySortOrder(code),
        }),
      );

      // 批量导入国家数据
      await this.dictionaryService.batchImportItems('countries', {
        items: countryItems,
      });

      console.log(`Successfully initialized ${countryItems.length} countries`);
    } catch (error) {
      console.error('Failed to initialize countries:', error);
      throw error;
    }
  }

  async getCountriesWithFlags(): Promise<any[]> {
    const countries = await this.dictionaryService.getDictionaryByCode('countries');
    
    return countries.map(country => ({
      code: country.code,
      name: country.name,
      flag: country.extraData?.flagIcon || '',
      countryCode: country.extraData?.countryCode || '',
      iso2: country.extraData?.iso2 || '',
      continent: country.extraData?.continent || '',
      isActive: country.isActive,
    }));
  }

  private getChineseName(code: string, englishName: string): string {
    // 常用国家的中文名称映射
    const chineseNames: Record<string, string> = {
      CN: '中国',
      US: '美国',
      GB: '英国',
      DE: '德国',
      FR: '法国',
      JP: '日本',
      KR: '韩国',
      IN: '印度',
      BR: '巴西',
      AU: '澳大利亚',
      CA: '加拿大',
      RU: '俄罗斯',
      IT: '意大利',
      ES: '西班牙',
      NL: '荷兰',
      BE: '比利时',
      CH: '瑞士',
      AT: '奥地利',
      SE: '瑞典',
      NO: '挪威',
      DK: '丹麦',
      FI: '芬兰',
      PL: '波兰',
      CZ: '捷克',
      HU: '匈牙利',
      GR: '希腊',
      PT: '葡萄牙',
      IE: '爱尔兰',
      LU: '卢森堡',
      MT: '马耳他',
      CY: '塞浦路斯',
      SK: '斯洛伐克',
      SI: '斯洛文尼亚',
      HR: '克罗地亚',
      BG: '保加利亚',
      RO: '罗马尼亚',
      LT: '立陶宛',
      LV: '拉脱维亚',
      EE: '爱沙尼亚',
      MX: '墨西哥',
      AR: '阿根廷',
      CL: '智利',
      CO: '哥伦比亚',
      PE: '秘鲁',
      VE: '委内瑞拉',
      EC: '厄瓜多尔',
      UY: '乌拉圭',
      PY: '巴拉圭',
      BO: '玻利维亚',
      GT: '危地马拉',
      HN: '洪都拉斯',
      SV: '萨尔瓦多',
      NI: '尼加拉瓜',
      CR: '哥斯达黎加',
      PA: '巴拿马',
      TH: '泰国',
      VN: '越南',
      MY: '马来西亚',
      SG: '新加坡',
      ID: '印度尼西亚',
      PH: '菲律宾',
      KH: '柬埔寨',
      LA: '老挝',
      MM: '缅甸',
      BD: '孟加拉国',
      LK: '斯里兰卡',
      NP: '尼泊尔',
      PK: '巴基斯坦',
      AF: '阿富汗',
      IR: '伊朗',
      IQ: '伊拉克',
      SA: '沙特阿拉伯',
      AE: '阿联酋',
      QA: '卡塔尔',
      KW: '科威特',
      BH: '巴林',
      OM: '阿曼',
      YE: '也门',
      JO: '约旦',
      LB: '黎巴嫩',
      SY: '叙利亚',
      IL: '以色列',
      TR: '土耳其',
      EG: '埃及',
      LY: '利比亚',
      TN: '突尼斯',
      DZ: '阿尔及利亚',
      MA: '摩洛哥',
      ZA: '南非',
      NG: '尼日利亚',
      KE: '肯尼亚',
      ET: '埃塞俄比亚',
      GH: '加纳',
      UG: '乌干达',
      TZ: '坦桑尼亚',
      ZW: '津巴布韦',
      BW: '博茨瓦纳',
      ZM: '赞比亚',
      MW: '马拉维',
      MZ: '莫桑比克',
      MG: '马达加斯加',
      MU: '毛里求斯',
      NZ: '新西兰',
      FJ: '斐济',
    };

    return chineseNames[code] || englishName;
  }

  private isActiveCountry(code: string): boolean {
    // 默认激活的常用国家
    const activeCountries = [
      'CN', 'US', 'GB', 'DE', 'FR', 'JP', 'KR', 'IN', 'BR', 'AU', 
      'CA', 'RU', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO',
      'DK', 'FI', 'TH', 'VN', 'MY', 'SG', 'ID', 'PH', 'SA', 'AE',
      'ZA', 'MX', 'AR', 'CL', 'CO', 'PE', 'NZ', 'TR', 'EG', 'NG',
    ];
    return activeCountries.includes(code);
  }

  private getCountrySortOrder(code: string): number {
    // 设置国家排序优先级
    const priorityCountries: Record<string, number> = {
      CN: 1,
      US: 2,
      GB: 3,
      DE: 4,
      FR: 5,
      JP: 6,
      KR: 7,
      IN: 8,
      BR: 9,
      AU: 10,
    };

    return priorityCountries[code] || 999;
  }
}