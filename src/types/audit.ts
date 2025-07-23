/**
 * 审计日志操作类型枚举
 */
export enum AuditAction {
  // CRUD操作
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // 审核操作
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REVIEW = 'REVIEW',
  
  // 状态变更
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
  
  // 登录相关
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  // 权限操作
  ASSIGN_PERMISSION = 'ASSIGN_PERMISSION',
  REMOVE_PERMISSION = 'REMOVE_PERMISSION',
  CHANGE_ROLE = 'CHANGE_ROLE',
  
  // 密码操作
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
  
  // 订阅操作
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  GIFT_SUBSCRIPTION = 'GIFT_SUBSCRIPTION',
  
  // 文件操作
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  DELETE_FILE = 'DELETE_FILE',
  
  // 系统操作
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // 其他操作
  VIEW = 'VIEW',
  SEARCH = 'SEARCH',
  OTHER = 'OTHER',
}

/**
 * 审计日志资源类型枚举
 */
export enum AuditResource {
  // 核心业务实体
  COMPANY = 'Company',
  PRODUCT = 'Product',
  USER = 'User',
  ADMIN_USER = 'AdminUser',
  
  // 业务流程实体
  INQUIRY = 'Inquiry',
  SAMPLE_REQUEST = 'SampleRequest',
  REGISTRATION_REQUEST = 'RegistrationRequest',
  ORDER = 'Order',
  
  // 系统管理实体
  PLAN = 'Plan',
  SUBSCRIPTION = 'Subscription',
  DICTIONARY = 'Dictionary',
  
  // 系统操作
  SYSTEM = 'System',
  FILE = 'File',
  LOGIN = 'Login',
  PERMISSION = 'Permission',
  
  // 其他
  OTHER = 'Other',
}

/**
 * 审计日志详情接口
 */
export interface AuditLogDetails {
  before?: object;
  after?: object;
  reason?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * 审计日志操作上下文
 */
export interface AuditContext {
  action: AuditAction;
  resource: AuditResource;
  resourceId: number;
  description?: string;
  details?: AuditLogDetails;
  skipLog?: boolean; // 是否跳过日志记录
}

/**
 * 审计日志装饰器选项
 */
export interface AuditLogOptions {
  action: AuditAction;
  resource: AuditResource;
  description?: string;
  skipCondition?: (context: any) => boolean; // 跳过条件函数
  getResourceId?: (args: any[], result?: any) => number; // 获取资源ID的函数
  getDetails?: (args: any[], result?: any, error?: any) => AuditLogDetails; // 获取详情的函数
}

/**
 * 操作类型描述映射
 */
export const AUDIT_ACTION_DESCRIPTIONS = {
  [AuditAction.CREATE]: '创建',
  [AuditAction.UPDATE]: '更新',
  [AuditAction.DELETE]: '删除',
  [AuditAction.APPROVE]: '批准',
  [AuditAction.REJECT]: '拒绝',
  [AuditAction.REVIEW]: '审核',
  [AuditAction.ACTIVATE]: '激活',
  [AuditAction.DEACTIVATE]: '停用',
  [AuditAction.ENABLE]: '启用',
  [AuditAction.DISABLE]: '禁用',
  [AuditAction.LOGIN]: '登录',
  [AuditAction.LOGOUT]: '退出登录',
  [AuditAction.LOGIN_FAILED]: '登录失败',
  [AuditAction.ASSIGN_PERMISSION]: '分配权限',
  [AuditAction.REMOVE_PERMISSION]: '移除权限',
  [AuditAction.CHANGE_ROLE]: '更改角色',
  [AuditAction.CHANGE_PASSWORD]: '修改密码',
  [AuditAction.RESET_PASSWORD]: '重置密码',
  [AuditAction.SUBSCRIBE]: '订阅',
  [AuditAction.UNSUBSCRIBE]: '取消订阅',
  [AuditAction.GIFT_SUBSCRIPTION]: '赠送订阅',
  [AuditAction.UPLOAD]: '上传文件',
  [AuditAction.DOWNLOAD]: '下载文件',
  [AuditAction.DELETE_FILE]: '删除文件',
  [AuditAction.SYSTEM_CONFIG]: '系统配置',
  [AuditAction.DATA_EXPORT]: '数据导出',
  [AuditAction.DATA_IMPORT]: '数据导入',
  [AuditAction.VIEW]: '查看',
  [AuditAction.SEARCH]: '搜索',
  [AuditAction.OTHER]: '其他操作',
} as const;

/**
 * 资源类型描述映射
 */
export const AUDIT_RESOURCE_DESCRIPTIONS = {
  [AuditResource.COMPANY]: '企业',
  [AuditResource.PRODUCT]: '产品',
  [AuditResource.USER]: '用户',
  [AuditResource.ADMIN_USER]: '管理员',
  [AuditResource.INQUIRY]: '询价单',
  [AuditResource.SAMPLE_REQUEST]: '样品申请',
  [AuditResource.REGISTRATION_REQUEST]: '登记申请',
  [AuditResource.ORDER]: '订单',
  [AuditResource.PLAN]: '会员计划',
  [AuditResource.SUBSCRIPTION]: '订阅',
  [AuditResource.DICTIONARY]: '字典',
  [AuditResource.SYSTEM]: '系统',
  [AuditResource.FILE]: '文件',
  [AuditResource.LOGIN]: '登录',
  [AuditResource.PERMISSION]: '权限',
  [AuditResource.OTHER]: '其他',
} as const;

/**
 * 审计日志辅助工具类
 */
export class AuditLogHelper {
  /**
   * 获取操作描述
   */
  static getActionDescription(action: AuditAction): string {
    return AUDIT_ACTION_DESCRIPTIONS[action] || action;
  }

  /**
   * 获取资源描述
   */
  static getResourceDescription(resource: AuditResource): string {
    return AUDIT_RESOURCE_DESCRIPTIONS[resource] || resource;
  }

  /**
   * 生成操作描述文本
   */
  static generateDescription(action: AuditAction, resource: AuditResource, customDescription?: string): string {
    if (customDescription) {
      return customDescription;
    }
    
    const actionDesc = this.getActionDescription(action);
    const resourceDesc = this.getResourceDescription(resource);
    
    return `${actionDesc}${resourceDesc}`;
  }

  /**
   * 清理敏感信息
   */
  static sanitizeDetails(details: AuditLogDetails): AuditLogDetails {
    const sanitized = { ...details };
    
    // 清理密码相关字段
    if (sanitized.before) {
      sanitized.before = this.sanitizeObject(sanitized.before);
    }
    
    if (sanitized.after) {
      sanitized.after = this.sanitizeObject(sanitized.after);
    }
    
    return sanitized;
  }

  /**
   * 清理对象中的敏感字段
   */
  private static sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    const sanitized = { ...obj };
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    });
    
    return sanitized;
  }
}