import { Injectable } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';
import { CountryDictionaryService } from './country-dictionary.service';
import { MultiLangText } from '../../types/multilang';
import { AdminPermission, PERMISSION_DESCRIPTIONS } from '../../types/permissions';

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
      
      // 权限系统字典
      await this.initializeAdminRoles();
      await this.initializeAdminPermissions();
      
      // VIP相关字典
      await this.initializeVipLevels();
      
      // 新闻资讯相关字典
      await this.initializeNewsCategories();
      
      // 邮件管理相关字典
      await this.initializeEmailTriggerEvents();
      
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
      {
        code: 'admin_roles',
        name: {
          'zh-CN': '管理员角色',
          en: 'Admin Roles',
          es: 'Roles de Administrador',
        } as MultiLangText,
        description: {
          'zh-CN': '系统管理员角色分类',
          en: 'System administrator role classification',
          es: 'Clasificación de roles de administrador del sistema',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 9,
      },
      {
        code: 'admin_permissions',
        name: {
          'zh-CN': '管理员权限',
          en: 'Admin Permissions',
          es: 'Permisos de Administrador',
        } as MultiLangText,
        description: {
          'zh-CN': '系统管理员权限定义',
          en: 'System administrator permission definitions',
          es: 'Definiciones de permisos de administrador del sistema',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 10,
      },
      {
        code: 'vip_level',
        name: {
          'zh-CN': 'VIP等级',
          en: 'VIP Level',
          es: 'Nivel VIP',
        } as MultiLangText,
        description: {
          'zh-CN': 'VIP会员等级分类',
          en: 'VIP membership level classification',
          es: 'Clasificación de nivel de membresía VIP',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 11,
      },
      {
        code: 'news_category',
        name: {
          'zh-CN': '新闻类别',
          en: 'News Category',
          es: 'Categoría de Noticias',
        } as MultiLangText,
        description: {
          'zh-CN': '新闻资讯内容分类',
          en: 'News content classification',
          es: 'Clasificación de contenido de noticias',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 12,
      },
      {
        code: 'email_trigger_event',
        name: {
          'zh-CN': '邮件触发事件',
          en: 'Email Trigger Event',
          es: 'Evento de Activación de Correo',
        } as MultiLangText,
        description: {
          'zh-CN': '邮件模板触发事件类型',
          en: 'Email template trigger event types',
          es: 'Tipos de eventos de activación de plantillas de correo',
        } as MultiLangText,
        isSystem: true,
        sortOrder: 13,
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

  private async initializeAdminRoles(): Promise<void> {
    const adminRoles = [
      {
        code: 'super_admin',
        name: {
          'zh-CN': '超级管理员',
          en: 'Super Administrator',
          es: 'Súper Administrador',
        } as MultiLangText,
        description: {
          'zh-CN': '拥有系统所有权限的超级管理员',
          en: 'Super administrator with all system permissions',
          es: 'Súper administrador con todos los permisos del sistema',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'admin',
        name: {
          'zh-CN': '管理员',
          en: 'Administrator',
          es: 'Administrador',
        } as MultiLangText,
        description: {
          'zh-CN': '具有大部分管理权限的普通管理员',
          en: 'Regular administrator with most management permissions',
          es: 'Administrador regular con la mayoría de permisos de gestión',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'moderator',
        name: {
          'zh-CN': '审核员',
          en: 'Moderator',
          es: 'Moderador',
        } as MultiLangText,
        description: {
          'zh-CN': '主要负责内容审核的管理员',
          en: 'Administrator primarily responsible for content moderation',
          es: 'Administrador principalmente responsable de la moderación de contenido',
        } as MultiLangText,
        sortOrder: 3,
      },
    ];

    await this.batchCreateItems('admin_roles', adminRoles);
  }

  private async initializeAdminPermissions(): Promise<void> {
    const permissions = Object.values(AdminPermission).map((permission, index) => ({
      code: permission,
      name: {
        'zh-CN': PERMISSION_DESCRIPTIONS[permission],
        en: permission.replace(/[_:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        es: PERMISSION_DESCRIPTIONS[permission], // 可以后续添加西班牙语翻译
      } as MultiLangText,
      description: {
        'zh-CN': `权限：${PERMISSION_DESCRIPTIONS[permission]}`,
        en: `Permission: ${permission.replace(/[_:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        es: `Permiso: ${PERMISSION_DESCRIPTIONS[permission]}`,
      } as MultiLangText,
      sortOrder: index + 1,
    }));

    await this.batchCreateItems('admin_permissions', permissions);
  }

  private async initializeVipLevels(): Promise<void> {
    const vipLevels = [
      {
        code: 'promotion',
        name: {
          'zh-CN': '促销版',
          en: 'Promotion Edition',
          es: 'Edición Promocional',
        } as MultiLangText,
        description: {
          'zh-CN': 'VIP促销版会员等级',
          en: 'VIP Promotion Edition membership level',
          es: 'Nivel de membresía VIP Edición Promocional',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'basic',
        name: {
          'zh-CN': '基础版',
          en: 'Basic Edition',
          es: 'Edición Básica',
        } as MultiLangText,
        description: {
          'zh-CN': 'VIP基础版会员等级',
          en: 'VIP Basic Edition membership level',
          es: 'Nivel de membresía VIP Edición Básica',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'advanced',
        name: {
          'zh-CN': '高级版',
          en: 'Advanced Edition',
          es: 'Edición Avanzada',
        } as MultiLangText,
        description: {
          'zh-CN': 'VIP高级版会员等级',
          en: 'VIP Advanced Edition membership level',
          es: 'Nivel de membresía VIP Edición Avanzada',
        } as MultiLangText,
        sortOrder: 3,
      },
    ];

    await this.batchCreateItems('vip_level', vipLevels);
  }

  private async initializeNewsCategories(): Promise<void> {
    const newsCategories = [
      {
        code: 'NEWS_POLICY',
        name: {
          'zh-CN': '政策法规',
          en: 'Policy & Regulations',
          es: 'Política y Regulaciones',
        } as MultiLangText,
        description: {
          'zh-CN': '农药行业相关政策法规资讯',
          en: 'Pesticide industry policy and regulatory news',
          es: 'Noticias sobre políticas y regulaciones de la industria de pesticidas',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'NEWS_MARKET',
        name: {
          'zh-CN': '市场动态',
          en: 'Market Dynamics',
          es: 'Dinámica del Mercado',
        } as MultiLangText,
        description: {
          'zh-CN': '农药市场趋势和动态',
          en: 'Pesticide market trends and dynamics',
          es: 'Tendencias y dinámica del mercado de pesticidas',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'NEWS_TECHNOLOGY',
        name: {
          'zh-CN': '技术创新',
          en: 'Technology Innovation',
          es: 'Innovación Tecnológica',
        } as MultiLangText,
        description: {
          'zh-CN': '农药技术研发和创新资讯',
          en: 'Pesticide technology R&D and innovation news',
          es: 'Noticias sobre I+D e innovación en tecnología de pesticidas',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'NEWS_INDUSTRY',
        name: {
          'zh-CN': '行业资讯',
          en: 'Industry News',
          es: 'Noticias de la Industria',
        } as MultiLangText,
        description: {
          'zh-CN': '农药行业综合资讯',
          en: 'Comprehensive pesticide industry news',
          es: 'Noticias integrales de la industria de pesticidas',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'NEWS_COMPANY',
        name: {
          'zh-CN': '企业动态',
          en: 'Company News',
          es: 'Noticias de Empresas',
        } as MultiLangText,
        description: {
          'zh-CN': '农药企业相关新闻',
          en: 'Pesticide company related news',
          es: 'Noticias relacionadas con empresas de pesticidas',
        } as MultiLangText,
        sortOrder: 5,
      },
      {
        code: 'NEWS_EXHIBITION',
        name: {
          'zh-CN': '展会活动',
          en: 'Exhibitions & Events',
          es: 'Exposiciones y Eventos',
        } as MultiLangText,
        description: {
          'zh-CN': '农药行业展会和活动信息',
          en: 'Pesticide industry exhibitions and events information',
          es: 'Información sobre exposiciones y eventos de la industria de pesticidas',
        } as MultiLangText,
        sortOrder: 6,
      },
    ];

    await this.batchCreateItems('news_category', newsCategories);
  }

  private async initializeEmailTriggerEvents(): Promise<void> {
    const emailTriggerEvents = [
      {
        code: 'inquiry.created',
        name: {
          'zh-CN': '询价创建时',
          en: 'Inquiry Created',
          es: 'Consulta Creada',
        } as MultiLangText,
        description: {
          'zh-CN': '当创建新询价时触发',
          en: 'Triggered when a new inquiry is created',
          es: 'Se activa cuando se crea una nueva consulta',
        } as MultiLangText,
        sortOrder: 1,
      },
      {
        code: 'inquiry.quoted',
        name: {
          'zh-CN': '询价报价时',
          en: 'Inquiry Quoted',
          es: 'Consulta Cotizada',
        } as MultiLangText,
        description: {
          'zh-CN': '当供应商对询价进行报价时触发',
          en: 'Triggered when supplier quotes an inquiry',
          es: 'Se activa cuando el proveedor cotiza una consulta',
        } as MultiLangText,
        sortOrder: 2,
      },
      {
        code: 'inquiry.accepted',
        name: {
          'zh-CN': '询价接受时',
          en: 'Inquiry Accepted',
          es: 'Consulta Aceptada',
        } as MultiLangText,
        description: {
          'zh-CN': '当买家接受询价报价时触发',
          en: 'Triggered when buyer accepts inquiry quote',
          es: 'Se activa cuando el comprador acepta la cotización de consulta',
        } as MultiLangText,
        sortOrder: 3,
      },
      {
        code: 'inquiry.declined',
        name: {
          'zh-CN': '询价拒绝时',
          en: 'Inquiry Declined',
          es: 'Consulta Rechazada',
        } as MultiLangText,
        description: {
          'zh-CN': '当买家拒绝询价报价时触发',
          en: 'Triggered when buyer declines inquiry quote',
          es: 'Se activa cuando el comprador rechaza la cotización de consulta',
        } as MultiLangText,
        sortOrder: 4,
      },
      {
        code: 'inquiry.expired',
        name: {
          'zh-CN': '询价过期时',
          en: 'Inquiry Expired',
          es: 'Consulta Expirada',
        } as MultiLangText,
        description: {
          'zh-CN': '当询价过期时触发',
          en: 'Triggered when inquiry expires',
          es: 'Se activa cuando la consulta expira',
        } as MultiLangText,
        sortOrder: 5,
      },
      {
        code: 'sample_request.created',
        name: {
          'zh-CN': '样品申请创建时',
          en: 'Sample Request Created',
          es: 'Solicitud de Muestra Creada',
        } as MultiLangText,
        description: {
          'zh-CN': '当创建样品申请时触发',
          en: 'Triggered when sample request is created',
          es: 'Se activa cuando se crea una solicitud de muestra',
        } as MultiLangText,
        sortOrder: 6,
      },
      {
        code: 'sample_request.approved',
        name: {
          'zh-CN': '样品申请批准时',
          en: 'Sample Request Approved',
          es: 'Solicitud de Muestra Aprobada',
        } as MultiLangText,
        description: {
          'zh-CN': '当样品申请被批准时触发',
          en: 'Triggered when sample request is approved',
          es: 'Se activa cuando se aprueba la solicitud de muestra',
        } as MultiLangText,
        sortOrder: 7,
      },
      {
        code: 'sample_request.rejected',
        name: {
          'zh-CN': '样品申请拒绝时',
          en: 'Sample Request Rejected',
          es: 'Solicitud de Muestra Rechazada',
        } as MultiLangText,
        description: {
          'zh-CN': '当样品申请被拒绝时触发',
          en: 'Triggered when sample request is rejected',
          es: 'Se activa cuando se rechaza la solicitud de muestra',
        } as MultiLangText,
        sortOrder: 8,
      },
      {
        code: 'sample_request.shipped',
        name: {
          'zh-CN': '样品发货时',
          en: 'Sample Request Shipped',
          es: 'Solicitud de Muestra Enviada',
        } as MultiLangText,
        description: {
          'zh-CN': '当样品发货时触发',
          en: 'Triggered when sample is shipped',
          es: 'Se activa cuando se envía la muestra',
        } as MultiLangText,
        sortOrder: 9,
      },
      {
        code: 'sample_request.delivered',
        name: {
          'zh-CN': '样品送达时',
          en: 'Sample Request Delivered',
          es: 'Solicitud de Muestra Entregada',
        } as MultiLangText,
        description: {
          'zh-CN': '当样品送达时触发',
          en: 'Triggered when sample is delivered',
          es: 'Se activa cuando se entrega la muestra',
        } as MultiLangText,
        sortOrder: 10,
      },
      {
        code: 'registration_request.created',
        name: {
          'zh-CN': '登记申请创建时',
          en: 'Registration Request Created',
          es: 'Solicitud de Registro Creada',
        } as MultiLangText,
        description: {
          'zh-CN': '当创建登记申请时触发',
          en: 'Triggered when registration request is created',
          es: 'Se activa cuando se crea una solicitud de registro',
        } as MultiLangText,
        sortOrder: 11,
      },
      {
        code: 'registration_request.processing',
        name: {
          'zh-CN': '登记申请处理中时',
          en: 'Registration Request Processing',
          es: 'Solicitud de Registro en Proceso',
        } as MultiLangText,
        description: {
          'zh-CN': '当登记申请开始处理时触发',
          en: 'Triggered when registration request starts processing',
          es: 'Se activa cuando comienza el procesamiento de la solicitud de registro',
        } as MultiLangText,
        sortOrder: 12,
      },
      {
        code: 'registration_request.completed',
        name: {
          'zh-CN': '登记申请完成时',
          en: 'Registration Request Completed',
          es: 'Solicitud de Registro Completada',
        } as MultiLangText,
        description: {
          'zh-CN': '当登记申请完成时触发',
          en: 'Triggered when registration request is completed',
          es: 'Se activa cuando se completa la solicitud de registro',
        } as MultiLangText,
        sortOrder: 13,
      },
      {
        code: 'company.approved',
        name: {
          'zh-CN': '企业审核通过时',
          en: 'Company Approved',
          es: 'Empresa Aprobada',
        } as MultiLangText,
        description: {
          'zh-CN': '当企业审核通过时触发',
          en: 'Triggered when company is approved',
          es: 'Se activa cuando se aprueba la empresa',
        } as MultiLangText,
        sortOrder: 14,
      },
      {
        code: 'company.rejected',
        name: {
          'zh-CN': '企业审核拒绝时',
          en: 'Company Rejected',
          es: 'Empresa Rechazada',
        } as MultiLangText,
        description: {
          'zh-CN': '当企业审核被拒绝时触发',
          en: 'Triggered when company is rejected',
          es: 'Se activa cuando se rechaza la empresa',
        } as MultiLangText,
        sortOrder: 15,
      },
      {
        code: 'user.welcome',
        name: {
          'zh-CN': '用户欢迎邮件',
          en: 'User Welcome',
          es: 'Bienvenida de Usuario',
        } as MultiLangText,
        description: {
          'zh-CN': '新用户注册时发送欢迎邮件',
          en: 'Send welcome email when new user registers',
          es: 'Enviar correo de bienvenida cuando se registra un nuevo usuario',
        } as MultiLangText,
        sortOrder: 16,
      },
      {
        code: 'user.password_reset',
        name: {
          'zh-CN': '密码重置邮件',
          en: 'Password Reset',
          es: 'Restablecimiento de Contraseña',
        } as MultiLangText,
        description: {
          'zh-CN': '用户请求重置密码时触发',
          en: 'Triggered when user requests password reset',
          es: 'Se activa cuando el usuario solicita restablecer la contraseña',
        } as MultiLangText,
        sortOrder: 17,
      },
    ];

    await this.batchCreateItems('email_trigger_event', emailTriggerEvents);
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