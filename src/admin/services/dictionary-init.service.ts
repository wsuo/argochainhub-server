import { Injectable } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { CountryDictionaryService } from './country-dictionary.service';
import { MultiLangText } from '../../types/multilang';

@Injectable()
export class DictionaryInitService {
  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly countryDictionaryService: CountryDictionaryService,
  ) {}

  async initializeAllDictionaries(): Promise<void> {
    console.log('Starting dictionary initialization...');
    
    try {
      // 1. 初始化字典分类
      await this.initializeCategories();
      
      // 2. 初始化基础字典数据
      await this.initializeBusinessTypes();
      await this.initializeCompanyStatuses();
      await this.initializeCompanyTypes();
      await this.initializeCompanySize();
      await this.initializeProductStatuses();
      await this.initializeFormulationTypes();
      await this.initializeProductCategories();
      
      // 3. 初始化国家数据
      await this.countryDictionaryService.initializeCountries();
      
      console.log('Dictionary initialization completed successfully');
    } catch (error) {
      console.error('Dictionary initialization failed:', error);
      throw error;
    }
  }

  private async initializeCategories(): Promise<void> {
    const categories = [
      {
        code: 'business_type',
        name: {
          'zh-CN': '业务类别',
          en: 'Business Type',
          es: 'Tipo de Negocio',
        } as MultiLangText,
        description: {
          'zh-CN': '企业主要业务类别分类',
          en: 'Main business type classification for companies',
          es: 'Clasificación del tipo de negocio principal para empresas',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 1,
      },
      {
        code: 'company_status',
        name: {
          'zh-CN': '企业状态',
          en: 'Company Status',
          es: 'Estado de la Empresa',
        } as MultiLangText,
        description: {
          'zh-CN': '企业认证审核状态',
          en: 'Company verification and approval status',
          es: 'Estado de verificación y aprobación de la empresa',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 2,
      },
      {
        code: 'company_type',
        name: {
          'zh-CN': '企业类型',
          en: 'Company Type',
          es: 'Tipo de Empresa',
        } as MultiLangText,
        description: {
          'zh-CN': '企业在平台中的角色类型',
          en: 'Company role type in the platform',
          es: 'Tipo de rol de la empresa en la plataforma',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 3,
      },
      {
        code: 'company_size',
        name: {
          'zh-CN': '企业规模',
          en: 'Company Size',
          es: 'Tamaño de Empresa',
        } as MultiLangText,
        description: {
          'zh-CN': '企业规模分类（按员工数量）',
          en: 'Company size classification (by employee count)',
          es: 'Clasificación del tamaño de empresa (por número de empleados)',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 4,
      },
      {
        code: 'product_status',
        name: {
          'zh-CN': '产品状态',
          en: 'Product Status',
          es: 'Estado del Producto',
        } as MultiLangText,
        description: {
          'zh-CN': '产品审核和发布状态',
          en: 'Product review and publication status',
          es: 'Estado de revisión y publicación del producto',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 5,
      },
      {
        code: 'formulation_type',
        name: {
          'zh-CN': '剂型类型',
          en: 'Formulation Type',
          es: 'Tipo de Formulación',
        } as MultiLangText,
        description: {
          'zh-CN': '农药产品剂型分类',
          en: 'Pesticide product formulation classification',
          es: 'Clasificación de formulación de productos pesticidas',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 6,
      },
      {
        code: 'product_category',
        name: {
          'zh-CN': '产品分类',
          en: 'Product Category',
          es: 'Categoría de Producto',
        } as MultiLangText,
        description: {
          'zh-CN': '农化产品功能分类',
          en: 'Agrochemical product functional classification',
          es: 'Clasificación funcional de productos agroquímicos',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 7,
      },
      {
        code: 'countries',
        name: {
          'zh-CN': '国家地区',
          en: 'Countries',
          es: 'Países',
        } as MultiLangText,
        description: {
          'zh-CN': '世界各国和地区列表',
          en: 'List of world countries and regions',
          es: 'Lista de países y regiones del mundo',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 8,
      },
    ];

    for (const category of categories) {
      try {
        await this.dictionaryService.createCategory(category);
        console.log(`Created category: ${category.code}`);
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`Category ${category.code} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
  }

  private async initializeBusinessTypes(): Promise<void> {
    const businessTypes = [
      {
        code: 'api_production',
        name: {
          'zh-CN': '原药生产',
          en: 'API Production',
          es: 'Producción de API',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'formulation_production',
        name: {
          'zh-CN': '制剂生产',
          en: 'Formulation Production',
          es: 'Producción de Formulación',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'api_formulation_production',
        name: {
          'zh-CN': '原药+制剂生产',
          en: 'API+Formulation Production',
          es: 'Producción de API+Formulación',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'domestic_trade',
        name: {
          'zh-CN': '国内贸易',
          en: 'Domestic Trade',
          es: 'Comercio Doméstico',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'international_trade',
        name: {
          'zh-CN': '国际贸易',
          en: 'International Trade',
          es: 'Comercio Internacional',
        } as MultiLangText,
        sortOrder: 5,
      },
      {
        code: 'production_international_trade',
        name: {
          'zh-CN': '生产+国际贸易',
          en: 'Production+International Trade',
          es: 'Producción+Comercio Internacional',
        } as MultiLangText,
        sortOrder: 6,
      },
      {
        code: 'freight_forwarding',
        name: {
          'zh-CN': '货代',
          en: 'Freight Forwarding',
          es: 'Transporte de Carga',
        } as MultiLangText,
        sortOrder: 7,
      },
      {
        code: 'logistics_transport',
        name: {
          'zh-CN': '物流运输',
          en: 'Logistics Transport',
          es: 'Transporte Logístico',
        } as MultiLangText,
        sortOrder: 8,
      },
      {
        code: 'intermediate',
        name: {
          'zh-CN': '中间体',
          en: 'Intermediate',
          es: 'Intermedio',
        } as MultiLangText,
        sortOrder: 9,
      },
      {
        code: 'adjuvant',
        name: {
          'zh-CN': '助剂',
          en: 'Adjuvant',
          es: 'Adyuvante',
        } as MultiLangText,
        sortOrder: 10,
      },
      {
        code: 'fertilizer',
        name: {
          'zh-CN': '化肥',
          en: 'Fertilizer',
          es: 'Fertilizante',
        } as MultiLangText,
        sortOrder: 11,
      },
      {
        code: 'plantation',
        name: {
          'zh-CN': '种植园',
          en: 'Plantation',
          es: 'Plantación',
        } as MultiLangText,
        sortOrder: 12,
      },
      {
        code: 'other',
        name: {
          'zh-CN': '其他',
          en: 'Other',
          es: 'Otro',
        } as MultiLangText,
        sortOrder: 13,
      },
    ];

    await this.batchCreateItems('business_type', businessTypes);
  }

  private async initializeCompanyStatuses(): Promise<void> {
    const companyStatuses = [
      {
        code: 'pending_review',
        name: {
          'zh-CN': '待审核',
          en: 'Pending Review',
          es: 'Pendiente de Revisión',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'active',
        name: {
          'zh-CN': '激活',
          en: 'Active',
          es: 'Activo',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'disabled',
        name: {
          'zh-CN': '禁用',
          en: 'Disabled',
          es: 'Deshabilitado',
        } as MultiLangText,
        sortOrder: 3,
      },
    ];

    await this.batchCreateItems('company_status', companyStatuses);
  }

  private async initializeCompanyTypes(): Promise<void> {
    const companyTypes = [
      {
        code: 'buyer',
        name: {
          'zh-CN': '买家',
          en: 'Buyer',
          es: 'Comprador',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'supplier',
        name: {
          'zh-CN': '供应商',
          en: 'Supplier',
          es: 'Proveedor',
        } as MultiLangText,
        sortOrder: 2,
      },
    ];

    await this.batchCreateItems('company_type', companyTypes);
  }

  private async initializeProductStatuses(): Promise<void> {
    const productStatuses = [
      {
        code: 'draft',
        name: {
          'zh-CN': '草稿',
          en: 'Draft',
          es: 'Borrador',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'pending_review',
        name: {
          'zh-CN': '待审核',
          en: 'Pending Review',
          es: 'Pendiente de Revisión',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'active',
        name: {
          'zh-CN': '激活',
          en: 'Active',
          es: 'Activo',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'rejected',
        name: {
          'zh-CN': '拒绝',
          en: 'Rejected',
          es: 'Rechazado',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'archived',
        name: {
          'zh-CN': '归档',
          en: 'Archived',
          es: 'Archivado',
        } as MultiLangText,
        sortOrder: 5,
      },
    ];

    await this.batchCreateItems('product_status', productStatuses);
  }

  private async initializeFormulationTypes(): Promise<void> {
    const formulationTypes = [
      {
        code: 'ec',
        name: {
          'zh-CN': '乳油 (EC)',
          en: 'Emulsifiable Concentrate (EC)',
          es: 'Concentrado Emulsificable (EC)',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'sc',
        name: {
          'zh-CN': '悬浮剂 (SC)',
          en: 'Suspension Concentrate (SC)',
          es: 'Concentrado de Suspensión (SC)',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'wp',
        name: {
          'zh-CN': '可湿性粉剂 (WP)',
          en: 'Wettable Powder (WP)',
          es: 'Polvo Humectable (WP)',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'wdg',
        name: {
          'zh-CN': '水分散粒剂 (WDG)',
          en: 'Water Dispersible Granule (WDG)',
          es: 'Gránulo Dispersable en Agua (WDG)',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'sl',
        name: {
          'zh-CN': '水剂 (SL)',
          en: 'Soluble Liquid (SL)',
          es: 'Líquido Soluble (SL)',
        } as MultiLangText,
        sortOrder: 5,
      },
      {
        code: 'tc',
        name: {
          'zh-CN': '原药 (TC)',
          en: 'Technical Concentrate (TC)',
          es: 'Concentrado Técnico (TC)',
        } as MultiLangText,
        sortOrder: 6,
      },
    ];

    await this.batchCreateItems('formulation_type', formulationTypes);
  }

  private async initializeProductCategories(): Promise<void> {
    const productCategories = [
      {
        code: 'herbicide',
        name: {
          'zh-CN': '除草剂',
          en: 'Herbicide',
          es: 'Herbicida',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'insecticide',
        name: {
          'zh-CN': '杀虫剂',
          en: 'Insecticide',
          es: 'Insecticida',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'fungicide',
        name: {
          'zh-CN': '杀菌剂',
          en: 'Fungicide',
          es: 'Fungicida',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'plant_growth_regulator',
        name: {
          'zh-CN': '植物生长调节剂',
          en: 'Plant Growth Regulator',
          es: 'Regulador del Crecimiento de Plantas',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'fertilizer',
        name: {
          'zh-CN': '肥料',
          en: 'Fertilizer',
          es: 'Fertilizante',
        } as MultiLangText,
        sortOrder: 5,
      },
      {
        code: 'adjuvant',
        name: {
          'zh-CN': '助剂',
          en: 'Adjuvant',
          es: 'Adyuvante',
        } as MultiLangText,
        sortOrder: 6,
      },
    ];

    await this.batchCreateItems('product_category', productCategories);
  }

  private async initializeCompanySize(): Promise<void> {
    const companySizes = [
      {
        code: 'startup',
        name: {
          'zh-CN': '初创企业 (1-10人)',
          en: 'Startup (1-10 employees)',
          es: 'Startup (1-10 empleados)',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'small',
        name: {
          'zh-CN': '小型企业 (11-50人)',
          en: 'Small Enterprise (11-50 employees)',
          es: 'Pequeña Empresa (11-50 empleados)',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'medium',
        name: {
          'zh-CN': '中型企业 (51-200人)',
          en: 'Medium Enterprise (51-200 employees)',
          es: 'Empresa Mediana (51-200 empleados)',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'large',
        name: {
          'zh-CN': '大型企业 (201-1000人)',
          en: 'Large Enterprise (201-1000 employees)',
          es: 'Gran Empresa (201-1000 empleados)',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'enterprise',
        name: {
          'zh-CN': '大型集团 (1000+人)',
          en: 'Enterprise Group (1000+ employees)',
          es: 'Grupo Empresarial (1000+ empleados)',
        } as MultiLangText,
        sortOrder: 5,
      },
    ];

    await this.batchCreateItems('company_size', companySizes);
  }

  private async batchCreateItems(categoryCode: string, items: any[]): Promise<void> {
    try {
      const itemsWithDefaults = items.map(item => ({
        ...item,
        isSystem: true,
        isActive: true,
      }));

      await this.dictionaryService.batchImportItems(categoryCode, {
        items: itemsWithDefaults,
      });
      console.log(`Created ${items.length} items for category: ${categoryCode}`);
    } catch (error) {
      if (error.message?.includes('already exist')) {
        console.log(`Items for category ${categoryCode} already exist, skipping...`);
      } else {
        throw error;
      }
    }
  }
}