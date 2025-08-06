# 字典数据获取指南

## 概述

管理员通知系统使用多个字典类型来定义通知的类型、优先级、分类等。本文档说明如何获取这些字典数据。

## 字典获取方式

### 方法1：通用字典接口

**获取所有字典分类：**
```bash
GET /api/v1/dict/categories
```

**获取特定分类的字典项：**
```bash
GET /api/v1/dict/categories/{categoryKey}/items
```

### 方法2：直接使用枚举值

前端可以直接使用以下枚举定义，无需从接口获取：

## 详细字典数据

### 1. 管理员通知类型 (admin_notification_type)

**接口获取：**
```bash
GET /api/v1/dict/categories/admin_notification_type/items
```

**预期响应：**
```json
{
  "success": true,
  "message": "获取字典项成功",
  "data": [
    {
      "key": "user_registration_pending",
      "value": "用户注册待审核",
      "description": "新用户提交注册申请",
      "order": 1,
      "isActive": true
    },
    {
      "key": "company_review_pending",
      "value": "企业认证待审核",
      "description": "企业提交认证申请",
      "order": 2,
      "isActive": true
    },
    {
      "key": "company_approved",
      "value": "企业审核通过",
      "description": "企业认证申请已通过",
      "order": 3,
      "isActive": true
    },
    {
      "key": "company_rejected",
      "value": "企业审核拒绝",
      "description": "企业认证申请被拒绝",
      "order": 4,
      "isActive": true
    },
    {
      "key": "product_review_pending",
      "value": "产品审核待处理",
      "description": "产品提交审核申请",
      "order": 5,
      "isActive": true
    },
    {
      "key": "product_approved",
      "value": "产品审核通过",
      "description": "产品审核申请已通过",
      "order": 6,
      "isActive": true
    },
    {
      "key": "product_rejected",
      "value": "产品审核拒绝",
      "description": "产品审核申请被拒绝",
      "order": 7,
      "isActive": true
    },
    {
      "key": "inquiry_created",
      "value": "新询价单创建",
      "description": "用户创建新询价单",
      "order": 8,
      "isActive": true
    },
    {
      "key": "business_transaction_success",
      "value": "交易成功",
      "description": "询价单交易达成",
      "order": 9,
      "isActive": true
    },
    {
      "key": "business_transaction_failed",
      "value": "交易失败",
      "description": "询价单被拒绝",
      "order": 10,
      "isActive": true
    },
    {
      "key": "user_complaint",
      "value": "用户投诉",
      "description": "用户提交投诉",
      "order": 11,
      "isActive": true
    },
    {
      "key": "system_maintenance",
      "value": "系统维护",
      "description": "系统维护通知",
      "order": 12,
      "isActive": true
    },
    {
      "key": "system_resource_warning",
      "value": "系统资源告警",
      "description": "系统资源使用告警",
      "order": 13,
      "isActive": true
    },
    {
      "key": "system_error",
      "value": "系统错误",
      "description": "系统错误通知",
      "order": 14,
      "isActive": true
    },
    {
      "key": "security_alert",
      "value": "安全告警",
      "description": "安全相关告警",
      "order": 15,
      "isActive": true
    },
    {
      "key": "data_backup_success",
      "value": "数据备份成功",
      "description": "数据备份完成",
      "order": 16,
      "isActive": true
    },
    {
      "key": "data_backup_failed",
      "value": "数据备份失败",
      "description": "数据备份失败",
      "order": 17,
      "isActive": true
    },
    {
      "key": "password_reset_request",
      "value": "密码重置请求",
      "description": "用户申请密码重置",
      "order": 18,
      "isActive": true
    }
  ]
}
```

### 2. 前端枚举定义（推荐）

**TypeScript枚举定义：**

```typescript
// 通知类型
export enum AdminNotificationType {
  USER_REGISTRATION_PENDING = 'user_registration_pending',
  COMPANY_REVIEW_PENDING = 'company_review_pending',
  COMPANY_APPROVED = 'company_approved',
  COMPANY_REJECTED = 'company_rejected',
  PRODUCT_REVIEW_PENDING = 'product_review_pending',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  INQUIRY_CREATED = 'inquiry_created',
  BUSINESS_TRANSACTION_SUCCESS = 'business_transaction_success',
  BUSINESS_TRANSACTION_FAILED = 'business_transaction_failed',
  USER_COMPLAINT = 'user_complaint',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_RESOURCE_WARNING = 'system_resource_warning',
  SYSTEM_ERROR = 'system_error',
  SECURITY_ALERT = 'security_alert',
  DATA_BACKUP_SUCCESS = 'data_backup_success',
  DATA_BACKUP_FAILED = 'data_backup_failed',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
}

// 优先级
export enum AdminNotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

// 分类
export enum AdminNotificationCategory {
  REVIEW = 'REVIEW',
  BUSINESS = 'BUSINESS',
  OPERATION = 'OPERATION',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
}

// 状态
export enum AdminNotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

// 显示名称映射
export const NotificationTypeLabels: Record<AdminNotificationType, string> = {
  [AdminNotificationType.USER_REGISTRATION_PENDING]: '用户注册待审核',
  [AdminNotificationType.COMPANY_REVIEW_PENDING]: '企业认证待审核',
  [AdminNotificationType.COMPANY_APPROVED]: '企业审核通过',
  [AdminNotificationType.COMPANY_REJECTED]: '企业审核拒绝',
  [AdminNotificationType.PRODUCT_REVIEW_PENDING]: '产品审核待处理',
  [AdminNotificationType.PRODUCT_APPROVED]: '产品审核通过',
  [AdminNotificationType.PRODUCT_REJECTED]: '产品审核拒绝',
  [AdminNotificationType.INQUIRY_CREATED]: '新询价单创建',
  [AdminNotificationType.BUSINESS_TRANSACTION_SUCCESS]: '交易成功',
  [AdminNotificationType.BUSINESS_TRANSACTION_FAILED]: '交易失败',
  [AdminNotificationType.USER_COMPLAINT]: '用户投诉',
  [AdminNotificationType.SYSTEM_MAINTENANCE]: '系统维护',
  [AdminNotificationType.SYSTEM_RESOURCE_WARNING]: '系统资源告警',
  [AdminNotificationType.SYSTEM_ERROR]: '系统错误',
  [AdminNotificationType.SECURITY_ALERT]: '安全告警',
  [AdminNotificationType.DATA_BACKUP_SUCCESS]: '数据备份成功',
  [AdminNotificationType.DATA_BACKUP_FAILED]: '数据备份失败',
  [AdminNotificationType.PASSWORD_RESET_REQUEST]: '密码重置请求',
};

export const PriorityLabels: Record<AdminNotificationPriority, string> = {
  [AdminNotificationPriority.LOW]: '低优先级',
  [AdminNotificationPriority.NORMAL]: '普通优先级',
  [AdminNotificationPriority.HIGH]: '高优先级',
  [AdminNotificationPriority.URGENT]: '紧急优先级',
  [AdminNotificationPriority.CRITICAL]: '严重优先级',
};

export const CategoryLabels: Record<AdminNotificationCategory, string> = {
  [AdminNotificationCategory.REVIEW]: '审核类',
  [AdminNotificationCategory.BUSINESS]: '业务类',
  [AdminNotificationCategory.OPERATION]: '运营类',
  [AdminNotificationCategory.SYSTEM]: '系统类',
  [AdminNotificationCategory.SECURITY]: '安全类',
};

export const StatusLabels: Record<AdminNotificationStatus, string> = {
  [AdminNotificationStatus.UNREAD]: '未读',
  [AdminNotificationStatus.READ]: '已读',
  [AdminNotificationStatus.ARCHIVED]: '已归档',
};
```

### 3. 优先级样式映射

```typescript
// 优先级颜色映射
export const PriorityColors: Record<AdminNotificationPriority, string> = {
  [AdminNotificationPriority.LOW]: '#909399',        // 灰色
  [AdminNotificationPriority.NORMAL]: '#409EFF',     // 蓝色
  [AdminNotificationPriority.HIGH]: '#E6A23C',       // 橙色
  [AdminNotificationPriority.URGENT]: '#F56C6C',     // 红色
  [AdminNotificationPriority.CRITICAL]: '#F56C6C',   // 红色
};

// Element Plus 标签类型映射
export const PriorityTagTypes: Record<AdminNotificationPriority, string> = {
  [AdminNotificationPriority.LOW]: 'info',
  [AdminNotificationPriority.NORMAL]: 'primary',
  [AdminNotificationPriority.HIGH]: 'warning',
  [AdminNotificationPriority.URGENT]: 'danger',
  [AdminNotificationPriority.CRITICAL]: 'danger',
};
```

### 4. 图标映射

```typescript
// 通知类型图标映射（使用Element Plus图标）
export const NotificationTypeIcons: Record<AdminNotificationType, string> = {
  [AdminNotificationType.USER_REGISTRATION_PENDING]: 'UserFilled',
  [AdminNotificationType.COMPANY_REVIEW_PENDING]: 'OfficeBuilding',
  [AdminNotificationType.COMPANY_APPROVED]: 'SuccessFilled',
  [AdminNotificationType.COMPANY_REJECTED]: 'WarningFilled',
  [AdminNotificationType.PRODUCT_REVIEW_PENDING]: 'GoodsFilled',
  [AdminNotificationType.PRODUCT_APPROVED]: 'CircleCheckFilled',
  [AdminNotificationType.PRODUCT_REJECTED]: 'CircleCloseFilled',
  [AdminNotificationType.INQUIRY_CREATED]: 'ChatDotSquare',
  [AdminNotificationType.BUSINESS_TRANSACTION_SUCCESS]: 'Money',
  [AdminNotificationType.BUSINESS_TRANSACTION_FAILED]: 'Warning',
  [AdminNotificationType.USER_COMPLAINT]: 'WarnTriangleFilled',
  [AdminNotificationType.SYSTEM_MAINTENANCE]: 'Tools',
  [AdminNotificationType.SYSTEM_RESOURCE_WARNING]: 'Monitor',
  [AdminNotificationType.SYSTEM_ERROR]: 'CircleCloseFilled',
  [AdminNotificationType.SECURITY_ALERT]: 'Lock',
  [AdminNotificationType.DATA_BACKUP_SUCCESS]: 'FolderChecked',
  [AdminNotificationType.DATA_BACKUP_FAILED]: 'FolderDelete',
  [AdminNotificationType.PASSWORD_RESET_REQUEST]: 'Key',
};
```

### 5. 使用示例

```vue
<template>
  <div class="notification-item">
    <el-icon :class="getIconClass(notification.type)">
      <component :is="getIcon(notification.type)" />
    </el-icon>
    
    <div class="notification-content">
      <h4>{{ notification.title }}</h4>
      <p>{{ notification.content }}</p>
      
      <el-tag 
        :type="getPriorityTagType(notification.priority)"
        size="small"
      >
        {{ getPriorityLabel(notification.priority) }}
      </el-tag>
      
      <el-tag 
        type="info" 
        size="small"
      >
        {{ getCategoryLabel(notification.category) }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NotificationTypeLabels,
  PriorityLabels,
  CategoryLabels,
  PriorityTagTypes,
  NotificationTypeIcons,
  AdminNotificationType,
  AdminNotificationPriority,
  AdminNotificationCategory
} from '@/types/notifications'

interface Notification {
  id: string
  type: AdminNotificationType
  title: string
  content: string
  priority: AdminNotificationPriority
  category: AdminNotificationCategory
}

const props = defineProps<{
  notification: Notification
}>()

const getPriorityLabel = (priority: AdminNotificationPriority) => {
  return PriorityLabels[priority]
}

const getCategoryLabel = (category: AdminNotificationCategory) => {
  return CategoryLabels[category]
}

const getPriorityTagType = (priority: AdminNotificationPriority) => {
  return PriorityTagTypes[priority]
}

const getIcon = (type: AdminNotificationType) => {
  return NotificationTypeIcons[type]
}
</script>
```

### 6. 动态获取字典（可选）

如果需要动态获取字典数据（比如支持多语言或字典可能更新），可以使用以下方式：

```typescript
class DictionaryService {
  private cache = new Map<string, any[]>()
  
  async getDictionaryItems(categoryKey: string): Promise<DictItem[]> {
    // 检查缓存
    if (this.cache.has(categoryKey)) {
      return this.cache.get(categoryKey)!
    }
    
    // 从API获取
    const response = await fetch(`/api/v1/dict/categories/${categoryKey}/items`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    const result = await response.json()
    if (result.success) {
      // 缓存结果
      this.cache.set(categoryKey, result.data)
      return result.data
    }
    
    throw new Error(result.message || '获取字典失败')
  }
  
  async getNotificationTypes(): Promise<DictItem[]> {
    return this.getDictionaryItems('admin_notification_type')
  }
}

interface DictItem {
  key: string
  value: string
  description: string
  order: number
  isActive: boolean
}
```

## 建议

1. **推荐使用枚举定义**：前端直接定义枚举，无需从接口获取，性能更好
2. **缓存机制**：如果使用动态获取，建议实现缓存机制
3. **类型安全**：使用TypeScript确保类型安全
4. **国际化**：如需多语言支持，可结合i18n使用动态获取方式