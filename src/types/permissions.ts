/**
 * 管理员权限枚举定义
 * 按功能模块划分，采用 resource:action 命名格式
 */
export enum AdminPermission {
  // 企业管理权限
  COMPANY_VIEW = 'company:view',           // 查看企业信息
  COMPANY_CREATE = 'company:create',        // 创建企业
  COMPANY_UPDATE = 'company:update',        // 更新企业信息
  COMPANY_DELETE = 'company:delete',        // 删除企业
  COMPANY_REVIEW = 'company:review',        // 审核企业

  // 产品管理权限
  PRODUCT_VIEW = 'product:view',           // 查看产品信息
  PRODUCT_CREATE = 'product:create',        // 创建产品
  PRODUCT_UPDATE = 'product:update',        // 更新产品信息
  PRODUCT_DELETE = 'product:delete',        // 删除产品
  PRODUCT_REVIEW = 'product:review',        // 审核产品

  // 用户管理权限
  USER_VIEW = 'user:view',                 // 查看用户信息
  USER_CREATE = 'user:create',             // 创建用户
  USER_UPDATE = 'user:update',             // 更新用户信息
  USER_DELETE = 'user:delete',             // 删除用户
  USER_MANAGE_SUBSCRIPTION = 'user:manage_subscription', // 管理用户订阅

  // 业务流程管理权限
  INQUIRY_VIEW = 'inquiry:view',           // 查看询价单
  INQUIRY_MANAGE = 'inquiry:manage',       // 管理询价单
  SAMPLE_REQUEST_VIEW = 'sample_request:view',     // 查看样品申请
  SAMPLE_REQUEST_MANAGE = 'sample_request:manage', // 管理样品申请
  REGISTRATION_REQUEST_VIEW = 'registration_request:view',     // 查看登记申请
  REGISTRATION_REQUEST_MANAGE = 'registration_request:manage', // 管理登记申请

  // 订单管理权限
  ORDER_VIEW = 'order:view',               // 查看订单
  ORDER_MANAGE = 'order:manage',           // 管理订单

  // 会员计划管理权限
  PLAN_VIEW = 'plan:view',                 // 查看会员计划
  PLAN_CREATE = 'plan:create',             // 创建会员计划
  PLAN_UPDATE = 'plan:update',             // 更新会员计划
  PLAN_DELETE = 'plan:delete',             // 删除会员计划

  // VIP配置管理权限
  VIP_CONFIG_VIEW = 'vip_config:view',           // 查看VIP配置
  VIP_CONFIG_CREATE = 'vip_config:create',       // 创建VIP配置
  VIP_CONFIG_UPDATE = 'vip_config:update',       // 更新VIP配置
  VIP_CONFIG_DELETE = 'vip_config:delete',       // 删除VIP配置

  // 系统管理权限
  ADMIN_MANAGE = 'admin:manage',           // 管理员账户管理
  DICTIONARY_MANAGE = 'dictionary:manage', // 字典管理
  SYSTEM_CONFIG = 'system:config',         // 系统配置
  AUDIT_LOG_VIEW = 'audit_log:view',       // 查看审计日志
  FILE_MANAGE = 'file:manage',             // 文件管理

  // 统计分析权限
  ANALYTICS_VIEW = 'analytics:view',       // 查看统计数据
  DASHBOARD_VIEW = 'dashboard:view',       // 查看仪表盘

  // 新闻资讯管理权限
  NEWS_VIEW = 'news:view',                 // 查看新闻资讯
  NEWS_CREATE = 'news:create',             // 创建新闻资讯
  NEWS_UPDATE = 'news:update',             // 更新新闻资讯
  NEWS_DELETE = 'news:delete',             // 删除新闻资讯
}

/**
 * 权限分组定义
 */
export const PERMISSION_GROUPS = {
  COMPANY: [
    AdminPermission.COMPANY_VIEW,
    AdminPermission.COMPANY_CREATE,
    AdminPermission.COMPANY_UPDATE,
    AdminPermission.COMPANY_DELETE,
    AdminPermission.COMPANY_REVIEW,
  ],
  PRODUCT: [
    AdminPermission.PRODUCT_VIEW,
    AdminPermission.PRODUCT_CREATE,
    AdminPermission.PRODUCT_UPDATE,
    AdminPermission.PRODUCT_DELETE,
    AdminPermission.PRODUCT_REVIEW,
  ],
  USER: [
    AdminPermission.USER_VIEW,
    AdminPermission.USER_CREATE,
    AdminPermission.USER_UPDATE,
    AdminPermission.USER_DELETE,
    AdminPermission.USER_MANAGE_SUBSCRIPTION,
  ],
  BUSINESS: [
    AdminPermission.INQUIRY_VIEW,
    AdminPermission.INQUIRY_MANAGE,
    AdminPermission.SAMPLE_REQUEST_VIEW,
    AdminPermission.SAMPLE_REQUEST_MANAGE,
    AdminPermission.REGISTRATION_REQUEST_VIEW,
    AdminPermission.REGISTRATION_REQUEST_MANAGE,
    AdminPermission.ORDER_VIEW,
    AdminPermission.ORDER_MANAGE,
  ],
  PLAN: [
    AdminPermission.PLAN_VIEW,
    AdminPermission.PLAN_CREATE,
    AdminPermission.PLAN_UPDATE,
    AdminPermission.PLAN_DELETE,
  ],
  VIP_CONFIG: [
    AdminPermission.VIP_CONFIG_VIEW,
    AdminPermission.VIP_CONFIG_CREATE,
    AdminPermission.VIP_CONFIG_UPDATE,
    AdminPermission.VIP_CONFIG_DELETE,
  ],
  SYSTEM: [
    AdminPermission.ADMIN_MANAGE,
    AdminPermission.DICTIONARY_MANAGE,
    AdminPermission.SYSTEM_CONFIG,
    AdminPermission.AUDIT_LOG_VIEW,
    AdminPermission.FILE_MANAGE,
  ],
  ANALYTICS: [
    AdminPermission.ANALYTICS_VIEW,
    AdminPermission.DASHBOARD_VIEW,
  ],
  NEWS: [
    AdminPermission.NEWS_VIEW,
    AdminPermission.NEWS_CREATE,
    AdminPermission.NEWS_UPDATE,
    AdminPermission.NEWS_DELETE,
  ],
} as const;

/**
 * 默认角色权限映射
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: Object.values(AdminPermission), // 超级管理员拥有所有权限
  admin: [
    // 企业管理权限（除删除外）
    AdminPermission.COMPANY_VIEW,
    AdminPermission.COMPANY_CREATE,
    AdminPermission.COMPANY_UPDATE,
    AdminPermission.COMPANY_REVIEW,
    
    // 产品管理权限（除删除外）
    AdminPermission.PRODUCT_VIEW,
    AdminPermission.PRODUCT_CREATE,
    AdminPermission.PRODUCT_UPDATE,
    AdminPermission.PRODUCT_REVIEW,
    
    // 用户管理权限（除删除外）
    AdminPermission.USER_VIEW,
    AdminPermission.USER_CREATE,
    AdminPermission.USER_UPDATE,
    AdminPermission.USER_MANAGE_SUBSCRIPTION,
    
    // 业务流程管理权限
    ...PERMISSION_GROUPS.BUSINESS,
    
    // 会员计划管理权限（除删除外）
    AdminPermission.PLAN_VIEW,
    AdminPermission.PLAN_CREATE,
    AdminPermission.PLAN_UPDATE,
    
    // VIP配置管理权限（除删除外）
    AdminPermission.VIP_CONFIG_VIEW,
    AdminPermission.VIP_CONFIG_CREATE,
    AdminPermission.VIP_CONFIG_UPDATE,
    
    // 系统权限（部分）
    AdminPermission.DICTIONARY_MANAGE,
    AdminPermission.AUDIT_LOG_VIEW,
    AdminPermission.FILE_MANAGE,
    
    // 统计分析权限
    ...PERMISSION_GROUPS.ANALYTICS,
    
    // 新闻资讯管理权限（除删除外）
    AdminPermission.NEWS_VIEW,
    AdminPermission.NEWS_CREATE,
    AdminPermission.NEWS_UPDATE,
  ],
  moderator: [
    // 审核相关权限
    AdminPermission.COMPANY_VIEW,
    AdminPermission.COMPANY_REVIEW,
    AdminPermission.PRODUCT_VIEW,
    AdminPermission.PRODUCT_REVIEW,
    
    // 业务流程查看权限
    AdminPermission.INQUIRY_VIEW,
    AdminPermission.SAMPLE_REQUEST_VIEW,
    AdminPermission.REGISTRATION_REQUEST_VIEW,
    AdminPermission.ORDER_VIEW,
    
    // 基础权限
    AdminPermission.USER_VIEW,
    AdminPermission.PLAN_VIEW,
    AdminPermission.DASHBOARD_VIEW,
  ],
} as const;

/**
 * 权限描述信息
 */
export const PERMISSION_DESCRIPTIONS = {
  [AdminPermission.COMPANY_VIEW]: '查看企业信息',
  [AdminPermission.COMPANY_CREATE]: '创建企业',
  [AdminPermission.COMPANY_UPDATE]: '更新企业信息',
  [AdminPermission.COMPANY_DELETE]: '删除企业',
  [AdminPermission.COMPANY_REVIEW]: '审核企业',
  
  [AdminPermission.PRODUCT_VIEW]: '查看产品信息',
  [AdminPermission.PRODUCT_CREATE]: '创建产品',
  [AdminPermission.PRODUCT_UPDATE]: '更新产品信息',
  [AdminPermission.PRODUCT_DELETE]: '删除产品',
  [AdminPermission.PRODUCT_REVIEW]: '审核产品',
  
  [AdminPermission.USER_VIEW]: '查看用户信息',
  [AdminPermission.USER_CREATE]: '创建用户',
  [AdminPermission.USER_UPDATE]: '更新用户信息',
  [AdminPermission.USER_DELETE]: '删除用户',
  [AdminPermission.USER_MANAGE_SUBSCRIPTION]: '管理用户订阅',
  
  [AdminPermission.INQUIRY_VIEW]: '查看询价单',
  [AdminPermission.INQUIRY_MANAGE]: '管理询价单',
  [AdminPermission.SAMPLE_REQUEST_VIEW]: '查看样品申请',
  [AdminPermission.SAMPLE_REQUEST_MANAGE]: '管理样品申请',
  [AdminPermission.REGISTRATION_REQUEST_VIEW]: '查看登记申请',
  [AdminPermission.REGISTRATION_REQUEST_MANAGE]: '管理登记申请',
  
  [AdminPermission.ORDER_VIEW]: '查看订单',
  [AdminPermission.ORDER_MANAGE]: '管理订单',
  
  [AdminPermission.PLAN_VIEW]: '查看会员计划',
  [AdminPermission.PLAN_CREATE]: '创建会员计划',
  [AdminPermission.PLAN_UPDATE]: '更新会员计划',
  [AdminPermission.PLAN_DELETE]: '删除会员计划',
  
  [AdminPermission.VIP_CONFIG_VIEW]: '查看VIP配置',
  [AdminPermission.VIP_CONFIG_CREATE]: '创建VIP配置',
  [AdminPermission.VIP_CONFIG_UPDATE]: '更新VIP配置',
  [AdminPermission.VIP_CONFIG_DELETE]: '删除VIP配置',
  
  [AdminPermission.ADMIN_MANAGE]: '管理员账户管理',
  [AdminPermission.DICTIONARY_MANAGE]: '字典管理',
  [AdminPermission.SYSTEM_CONFIG]: '系统配置',
  [AdminPermission.AUDIT_LOG_VIEW]: '查看审计日志',
  [AdminPermission.FILE_MANAGE]: '文件管理',
  
  [AdminPermission.ANALYTICS_VIEW]: '查看统计数据',
  [AdminPermission.DASHBOARD_VIEW]: '查看仪表盘',
  
  [AdminPermission.NEWS_VIEW]: '查看新闻资讯',
  [AdminPermission.NEWS_CREATE]: '创建新闻资讯',
  [AdminPermission.NEWS_UPDATE]: '更新新闻资讯',
  [AdminPermission.NEWS_DELETE]: '删除新闻资讯',
} as const;

/**
 * 权限类型定义
 */
export type PermissionType = AdminPermission;

/**
 * 角色类型定义
 */
export type AdminRole = 'super_admin' | 'admin' | 'moderator';

/**
 * 权限检查辅助函数
 */
export class PermissionHelper {
  /**
   * 检查用户是否拥有指定权限
   */
  static hasPermission(userPermissions: AdminPermission[], requiredPermission: AdminPermission): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * 检查用户是否拥有任一权限
   */
  static hasAnyPermission(userPermissions: AdminPermission[], requiredPermissions: AdminPermission[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * 检查用户是否拥有所有权限
   */
  static hasAllPermissions(userPermissions: AdminPermission[], requiredPermissions: AdminPermission[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * 根据角色获取默认权限
   */
  static getDefaultPermissionsByRole(role: AdminRole): AdminPermission[] {
    return [...(DEFAULT_ROLE_PERMISSIONS[role] || [])];
  }

  /**
   * 获取权限描述
   */
  static getPermissionDescription(permission: AdminPermission): string {
    return PERMISSION_DESCRIPTIONS[permission] || permission;
  }
}