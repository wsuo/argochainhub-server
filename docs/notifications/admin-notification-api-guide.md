# 管理员通知系统接口对接文档

## 概述

管理员通知系统为后台管理提供实时通知功能，支持WebSocket实时推送和HTTP API管理。系统基于管理员权限进行智能通知分发，确保管理员只接收与其职责相关的通知。

## 目录

- [1. 认证说明](#1-认证说明)
- [2. 字典类型定义](#2-字典类型定义)
- [3. HTTP API接口](#3-http-api接口)
- [4. WebSocket实时推送](#4-websocket实时推送)
- [5. 业务场景说明](#5-业务场景说明)
- [6. 错误处理](#6-错误处理)

---

## 1. 认证说明

所有接口都需要管理员JWT Token认证：

```
Authorization: Bearer <管理员access_token>
```

### 获取管理员Token

**接口地址：** `POST /api/v1/auth/admin/login`

**请求体：**
```json
{
  "username": "superadmin",
  "password": "Admin123!"
}
```

**响应体：**
```json
{
  "success": true,
  "message": "管理员登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "superadmin",
      "role": "super_admin",
      "lastLoginAt": "2025-08-06T07:37:09.961Z"
    }
  }
}
```

---

## 2. 字典类型定义

### 2.1 通知类型 (AdminNotificationType)

**字典分类：** `admin_notification_type`

**获取字典接口：** `GET /api/v1/dict/categories/admin_notification_type/items`

| 字典键 | 中文名称 | 说明 |
|--------|----------|------|
| `user_registration_pending` | 用户注册待审核 | 新用户提交注册申请 |
| `company_review_pending` | 企业认证待审核 | 企业提交认证申请 |
| `company_approved` | 企业审核通过 | 企业认证申请已通过 |
| `company_rejected` | 企业审核拒绝 | 企业认证申请被拒绝 |
| `product_review_pending` | 产品审核待处理 | 产品提交审核申请 |
| `product_approved` | 产品审核通过 | 产品审核申请已通过 |
| `product_rejected` | 产品审核拒绝 | 产品审核申请被拒绝 |
| `inquiry_created` | 新询价单创建 | 用户创建新询价单 |
| `business_transaction_success` | 交易成功 | 询价单交易达成 |
| `business_transaction_failed` | 交易失败 | 询价单被拒绝 |
| `user_complaint` | 用户投诉 | 用户提交投诉 |
| `system_maintenance` | 系统维护 | 系统维护通知 |
| `system_resource_warning` | 系统资源告警 | 系统资源使用告警 |
| `system_error` | 系统错误 | 系统错误通知 |
| `security_alert` | 安全告警 | 安全相关告警 |
| `data_backup_success` | 数据备份成功 | 数据备份完成 |
| `data_backup_failed` | 数据备份失败 | 数据备份失败 |
| `password_reset_request` | 密码重置请求 | 用户申请密码重置 |

### 2.2 通知优先级 (AdminNotificationPriority)

| 枚举值 | 中文名称 | 说明 |
|--------|----------|------|
| `LOW` | 低优先级 | 一般信息通知 |
| `NORMAL` | 普通优先级 | 常规业务通知 |
| `HIGH` | 高优先级 | 重要业务通知 |
| `URGENT` | 紧急优先级 | 紧急处理通知 |
| `CRITICAL` | 严重优先级 | 系统严重告警 |

### 2.3 通知分类 (AdminNotificationCategory)

| 枚举值 | 中文名称 | 说明 |
|--------|----------|------|
| `REVIEW` | 审核类 | 需要审核的业务 |
| `BUSINESS` | 业务类 | 一般业务通知 |
| `OPERATION` | 运营类 | 运营相关通知 |
| `SYSTEM` | 系统类 | 系统相关通知 |
| `SECURITY` | 安全类 | 安全相关通知 |

### 2.4 通知状态 (AdminNotificationStatus)

| 枚举值 | 中文名称 | 说明 |
|--------|----------|------|
| `UNREAD` | 未读 | 通知未读状态 |
| `READ` | 已读 | 通知已读状态 |
| `ARCHIVED` | 已归档 | 通知已归档状态 |

### 2.5 管理员权限 (AdminPermission)

权限用于控制通知分发，详细权限列表请参考管理员权限系统文档。

**常用权限：**
- `USER_VIEW` - 用户查看权限
- `COMPANY_REVIEW` - 企业审核权限
- `COMPANY_VIEW` - 企业查看权限
- `PRODUCT_REVIEW` - 产品审核权限
- `PRODUCT_VIEW` - 产品查看权限
- `INQUIRY_VIEW` - 询价单查看权限
- `ADMIN_MANAGE` - 管理员管理权限
- `SYSTEM_CONFIG` - 系统配置权限

---

## 3. HTTP API接口

### 3.1 获取我的通知列表

**接口地址：** `GET /api/v1/admin/notifications`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `page` | number | 否 | 页码，默认1 | `1` |
| `limit` | number | 否 | 每页数量，默认20 | `20` |
| `status` | string | 否 | 通知状态筛选 | `UNREAD` |
| `priority` | string | 否 | 优先级筛选 | `HIGH` |
| `category` | string | 否 | 分类筛选 | `REVIEW` |
| `type` | string | 否 | 通知类型筛选 | `company_review_pending` |

**请求示例：**
```bash
GET /api/v1/admin/notifications?page=1&limit=10&status=UNREAD&priority=HIGH
```

**响应体：**
```json
{
  "success": true,
  "message": "获取管理员通知列表成功",
  "data": [
    {
      "id": "18",
      "createdAt": "2025-08-06T07:34:59.939Z",
      "updatedAt": "2025-08-06T07:34:59.939Z",
      "deletedAt": null,
      "type": "system_resource_warning",
      "title": "系统告警：CPU_CRITICAL",
      "content": "CPU负载过高: 165.60%",
      "priority": "critical",
      "category": "system",
      "status": "unread",
      "data": {
        "alertType": "CPU_CRITICAL",
        "timestamp": "2025-08-06T07:35:00.500Z",
        "alertLevel": "critical"
      },
      "readAt": null,
      "archivedAt": null,
      "expiresAt": null,
      "adminUserId": 1
    }
  ],
  "meta": {
    "totalItems": 10,
    "currentPage": 1,
    "totalPages": 1,
    "itemsPerPage": 20
  }
}
```

### 3.2 获取未读通知数量

**接口地址：** `GET /api/v1/admin/notifications/unread-count`

**响应体：**
```json
{
  "success": true,
  "message": "获取未读数量成功",
  "data": {
    "count": 10
  }
}
```

### 3.3 获取按优先级分组的未读数量

**接口地址：** `GET /api/v1/admin/notifications/unread-count/by-priority`

**响应体：**
```json
{
  "success": true,
  "message": "获取优先级未读数量成功",
  "data": {
    "CRITICAL": 3,
    "URGENT": 1,
    "HIGH": 2,
    "NORMAL": 4,
    "LOW": 0
  }
}
```

### 3.4 标记通知为已读

**接口地址：** `PATCH /api/v1/admin/notifications/{id}/read`

**路径参数：**
- `id` - 通知ID (number)

**响应体：**
```json
{
  "success": true,
  "message": "标记为已读成功",
  "data": {
    "id": "18",
    "status": "read",
    "readAt": "2025-08-06T07:40:00.000Z",
    // ...其他字段
  }
}
```

### 3.5 标记所有通知为已读

**接口地址：** `PATCH /api/v1/admin/notifications/read-all`

**响应体：**
```json
{
  "success": true,
  "message": "所有通知已标记为已读",
  "data": null
}
```

### 3.6 归档通知

**接口地址：** `PATCH /api/v1/admin/notifications/{id}/archive`

**路径参数：**
- `id` - 通知ID (number)

**响应体：**
```json
{
  "success": true,
  "message": "通知归档成功",
  "data": {
    "id": "18",
    "status": "archived",
    "archivedAt": "2025-08-06T07:40:00.000Z",
    // ...其他字段
  }
}
```

### 3.7 删除通知

**接口地址：** `DELETE /api/v1/admin/notifications/{id}`

**路径参数：**
- `id` - 通知ID (number)

**响应体：**
```json
{
  "success": true,
  "message": "通知删除成功",
  "data": null
}
```

---

## 4. 管理员通知管理接口（需要管理权限）

### 4.1 发送广播通知

**接口地址：** `POST /api/v1/admin/notifications/broadcast`

**权限要求：** `ADMIN_MANAGE`

**请求体：**
```json
{
  "type": "system_maintenance",
  "title": "系统维护通知",
  "content": "系统将在今晚23:00进行例行维护，预计维护时间1小时。",
  "priority": "HIGH",
  "category": "SYSTEM",
  "data": {
    "maintenanceTime": "2025-08-06T23:00:00Z",
    "estimatedDuration": "1小时"
  }
}
```

**响应体：**
```json
{
  "success": true,
  "message": "广播通知发送成功，共 2 个管理员收到通知",
  "data": {
    "count": 2
  }
}
```

### 4.2 根据权限发送通知

**接口地址：** `POST /api/v1/admin/notifications/by-permission`

**权限要求：** `ADMIN_MANAGE`

**请求体：**
```json
{
  "requiredPermissions": ["COMPANY_REVIEW", "COMPANY_VIEW"],
  "type": "company_review_pending",
  "title": "企业审核提醒",
  "content": "有新的企业认证申请需要审核。",
  "priority": "NORMAL",
  "category": "REVIEW",
  "data": {
    "companyId": 123,
    "companyName": "测试公司",
    "actionUrl": "/admin/companies/123"
  }
}
```

**响应体：**
```json
{
  "success": true,
  "message": "权限通知发送成功，共 1 个管理员收到通知",
  "data": {
    "count": 1
  }
}
```

### 4.3 发送系统告警

**接口地址：** `POST /api/v1/admin/notifications/system-alert`

**权限要求：** `SYSTEM_CONFIG`

**请求体：**
```json
{
  "alertType": "MEMORY_WARNING",
  "message": "系统内存使用率达到85%，请注意监控。",
  "level": "warning"
}
```

**字段说明：**
- `alertType` - 告警类型，如：`MEMORY_WARNING`、`CPU_CRITICAL`、`DISK_FULL`
- `message` - 告警消息内容
- `level` - 告警级别：`warning`、`error`、`critical`

**响应体：**
```json
{
  "success": true,
  "message": "系统告警发送成功，共 2 个管理员收到通知",
  "data": {
    "count": 2
  }
}
```

### 4.4 清理过期通知

**接口地址：** `DELETE /api/v1/admin/notifications/cleanup-expired`

**权限要求：** `SYSTEM_CONFIG`

**响应体：**
```json
{
  "success": true,
  "message": "清理完成，共清理 0 个过期通知",
  "data": {
    "count": 0
  }
}
```

---

## 5. WebSocket实时推送

### 5.1 连接建立

**WebSocket地址：** `ws://localhost:3050/notifications`

**连接流程：**

1. 建立WebSocket连接时在URL中提供Token和类型参数
2. 连接成功后开始接收实时通知

### 5.2 管理员连接方式

**连接URL格式：**
```
ws://localhost:3050/notifications?token={JWT_TOKEN}&type=admin
```

**JavaScript连接示例：**
```javascript
const token = 'your_admin_jwt_token';
const socket = new WebSocket(`ws://localhost:3050/notifications?token=${encodeURIComponent(token)}&type=admin`);

socket.onopen = (event) => {
  console.log('管理员WebSocket连接成功');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    console.log('收到新通知:', data);
  }
};
```

### 5.3 实时通知消息

**通知消息格式：**
```json
{
  "type": "notification",
  "id": 18,
  "notificationType": "system_resource_warning",
  "title": "系统告警：CPU_CRITICAL",
  "content": "CPU负载过高: 165.60%",
  "priority": "critical",
  "category": "system",
  "data": {
    "alertType": "CPU_CRITICAL",
    "timestamp": "2025-08-06T07:35:00.500Z",
    "alertLevel": "critical"
  },
  "createdAt": "2025-08-06T07:34:59.939Z"
}
```

**未读数量更新：**
```json
{
  "type": "unread_count_update",
  "count": 9
}
```

### 5.4 WebSocket测试页面

项目提供了测试页面：`/test/websocket-test.html`

打开该页面可以：
- 测试WebSocket连接
- 验证管理员认证
- 实时查看通知推送
- 测试HTTP API触发通知

---

## 6. 业务场景说明

### 6.1 自动触发的通知

以下业务操作会自动触发管理员通知：

**用户注册：**
- 触发时机：新用户注册成功
- 通知类型：`user_registration_pending`
- 接收人员：具有`USER_VIEW`权限的管理员

**企业认证：**
- 触发时机：企业提交认证申请
- 通知类型：`company_review_pending`
- 接收人员：具有`COMPANY_REVIEW`权限的管理员

**企业认证结果：**
- 触发时机：管理员审核企业认证
- 通知类型：`company_approved` 或 `company_rejected`
- 接收人员：具有`COMPANY_VIEW`权限的管理员

**产品审核：**
- 触发时机：产品提交审核申请
- 通知类型：`product_review_pending`
- 接收人员：具有`PRODUCT_REVIEW`权限的管理员

**产品审核结果：**
- 触发时机：管理员审核产品
- 通知类型：`product_approved` 或 `product_rejected`
- 接收人员：具有`PRODUCT_VIEW`权限的管理员

**询价单操作：**
- 触发时机：用户创建询价单
- 通知类型：`inquiry_created`
- 接收人员：具有`INQUIRY_VIEW`权限的管理员

**询价单结果：**
- 触发时机：询价单确认或拒绝
- 通知类型：`business_transaction_success` 或 `business_transaction_failed`
- 接收人员：具有`INQUIRY_VIEW`权限的管理员

### 6.2 系统监控通知

系统会自动监控以下指标并发送告警：

**内存使用率：**
- 85%以上：`MEMORY_WARNING` (HIGH优先级)
- 95%以上：`MEMORY_CRITICAL` (CRITICAL优先级)

**CPU负载：**
- 150%以上：`CPU_CRITICAL` (CRITICAL优先级)

**磁盘使用：**
- 90%以上：`DISK_WARNING` (HIGH优先级)
- 95%以上：`DISK_CRITICAL` (CRITICAL优先级)

监控频率：每5分钟检查一次

---

## 7. 错误处理

### 7.1 常见错误码

| HTTP状态码 | 错误类型 | 说明 |
|------------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或Token过期 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

### 7.2 错误响应格式

```json
{
  "success": false,
  "message": "具体错误信息",
  "error": "错误类型",
  "statusCode": 400
}
```

### 7.3 Token过期处理

当收到401错误时，需要：
1. 重新调用管理员登录接口
2. 更新存储的Token
3. 重新建立WebSocket连接（如果使用）

---

## 8. 系统监控接口

### 8.1 获取系统指标

**接口地址：** `GET /api/v1/admin/system-monitor/metrics`

**权限要求：** 管理员权限

**响应体：**
```json
{
  "success": true,
  "message": "系统指标获取成功",
  "data": {
    "dbConnectionStatus": "healthy",
    "dbConnectionCount": 1,
    "memoryUsage": {
      "used": 17113481216,
      "total": 17179869184,
      "percentage": 100
    },
    "diskUsage": {
      "used": 0,
      "total": 105806888960,
      "percentage": 0
    },
    "businessMetrics": {
      "totalUsers": 19,
      "activeUsers": 13,
      "pendingCompanies": 5,
      "pendingProducts": 0,
      "recentErrors": 0
    },
    "cpuUsage": [8.47, 10.46, 11.69],
    "uptime": 1664291
  }
}
```

### 8.2 获取系统状态概览

**接口地址：** `GET /api/v1/admin/system-monitor/status`

**权限要求：** 管理员权限

**响应体：**
```json
{
  "success": true,
  "message": "系统状态获取成功",
  "data": {
    "overallHealth": "critical",
    "healthScore": 55,
    "timestamp": "2025-08-06T07:37:11.532Z",
    "summary": {
      "database": "healthy",
      "memory": "critical",
      "disk": "healthy",
      "cpu": "critical",
      "business": {
        "pendingReviews": 5,
        "userActivity": "13/19"
      }
    },
    "alerts": [
      "内存使用率过高: 100%"
    ]
  }
}
```

### 8.3 手动触发健康检查

**接口地址：** `POST /api/v1/admin/system-monitor/health-check`

**权限要求：** 管理员权限

**响应体：**
```json
{
  "success": true,
  "message": "系统健康检查已完成",
  "data": {
    "metrics": {
      // 系统指标数据
    },
    "triggeredBy": "superadmin",
    "triggeredAt": "2025-08-06T07:37:10.559Z"
  }
}
```

---

## 9. 前端集成建议

### 9.1 初始化步骤

1. **获取Token**：管理员登录后获取JWT Token
2. **建立WebSocket连接**：用于接收实时通知
3. **获取初始数据**：加载通知列表和未读数量
4. **监听实时消息**：处理WebSocket推送的通知

### 9.2 推荐的状态管理

**Vuex/Pinia状态结构：**
```javascript
const notificationStore = {
  state: {
    notifications: [],      // 通知列表
    unreadCount: 0,        // 未读数量
    unreadByPriority: {},  // 按优先级分组的未读数量
    wsConnected: false,    // WebSocket连接状态
    systemStatus: null,    // 系统状态
  },
  actions: {
    // 获取通知列表
    async fetchNotifications(filters) {},
    // 标记已读
    async markAsRead(id) {},
    // 建立WebSocket连接
    async connectWebSocket() {},
    // 处理实时通知
    handleRealtimeNotification(notification) {},
  }
}
```

### 9.3 UI组件建议

**通知铃铛组件：**
- 显示未读数量
- 点击显示通知列表
- 支持按优先级分组显示

**通知列表组件：**
- 支持分页加载
- 支持状态筛选
- 支持批量操作

**系统状态面板：**
- 显示系统健康状态
- 显示关键指标
- 支持手动刷新

### 9.4 错误处理建议

```javascript
// API错误处理
const handleApiError = (error) => {
  if (error.status === 401) {
    // Token过期，重新登录
    this.$router.push('/login');
  } else if (error.status === 403) {
    // 权限不足
    this.$message.error('权限不足');
  } else {
    // 其他错误
    this.$message.error(error.message || '操作失败');
  }
};

// WebSocket断线重连
const setupWebSocketReconnect = () => {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  const reconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        connectWebSocket();
      }, 1000 * Math.pow(2, reconnectAttempts)); // 指数退避
    }
  };
};
```

---

## 10. 测试工具

### 10.1 HTTP API测试脚本

项目提供了完整的测试脚本：`/test/test-admin-notifications.sh`

运行测试：
```bash
./test/test-admin-notifications.sh
```

### 10.2 WebSocket测试页面

打开测试页面：`/test/websocket-test.html`

功能包括：
- WebSocket连接测试
- 认证流程测试
- 实时通知接收测试
- HTTP API触发测试

---

## 11. 联系支持

如在对接过程中遇到问题，请：

1. 查看控制台日志获取详细错误信息
2. 确认Token是否有效且具有相应权限
3. 检查网络连接和服务器状态
4. 参考测试工具进行问题排查

技术支持：后端开发团队
文档版本：v1.0
最后更新：2025-08-06