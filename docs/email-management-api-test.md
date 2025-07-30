# 邮件管理API测试文档

## 基础信息

- 基础URL: `http://localhost:3050/api/v1`
- 需要在请求头中添加: `Authorization: Bearer {token}`

## 一、邮件配置管理

### 1.1 获取邮件配置列表

**请求:**
```http
GET /admin/email-configs?page=1&limit=10
```

**响应示例:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "主邮件服务器",
      "host": "smtp.gmail.com",
      "port": 465,
      "secure": true,
      "authUser": "noreply@argochainhub.com",
      "authPass": "******",
      "fromEmail": "noreply@argochainhub.com",
      "fromName": "ArgoChainHub",
      "isDefault": true,
      "isActive": true,
      "maxRetries": 3,
      "retryDelay": 60,
      "createdAt": "2025-07-30T12:00:00.000Z",
      "updatedAt": "2025-07-30T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### 1.2 创建邮件配置

**请求:**
```http
POST /admin/email-configs
Content-Type: application/json

{
  "name": "主邮件服务器",
  "host": "smtp.gmail.com",
  "port": 465,
  "secure": true,
  "authUser": "noreply@argochainhub.com",
  "authPass": "your-password",
  "fromEmail": "noreply@argochainhub.com",
  "fromName": "ArgoChainHub",
  "isDefault": true,
  "maxRetries": 3,
  "retryDelay": 60
}
```

**响应示例:**
```json
{
  "id": 1,
  "name": "主邮件服务器",
  "host": "smtp.gmail.com",
  "port": 465,
  "secure": true,
  "authUser": "noreply@argochainhub.com",
  "authPass": "******",
  "fromEmail": "noreply@argochainhub.com",
  "fromName": "ArgoChainHub",
  "isDefault": true,
  "isActive": true,
  "maxRetries": 3,
  "retryDelay": 60,
  "createdAt": "2025-07-30T12:00:00.000Z",
  "updatedAt": "2025-07-30T12:00:00.000Z"
}
```

### 1.3 更新邮件配置

**请求:**
```http
PUT /admin/email-configs/1
Content-Type: application/json

{
  "name": "备用邮件服务器",
  "host": "smtp.office365.com",
  "port": 587,
  "secure": false,
  "isDefault": false
}
```

### 1.4 删除邮件配置

**请求:**
```http
DELETE /admin/email-configs/1
```

### 1.5 测试邮件配置

**请求:**
```http
POST /admin/email-configs/1/test
Content-Type: application/json

{
  "testEmail": "test@example.com"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "测试邮件发送成功，请检查收件箱"
}
```

## 二、邮件模板管理

### 2.1 获取邮件模板列表

**请求:**
```http
GET /admin/email-templates?page=1&limit=10&isActive=true
```

**响应示例:**
```json
{
  "items": [
    {
      "id": 1,
      "code": "inquiry_notification",
      "name": {
        "zh-CN": "询价通知",
        "en": "Inquiry Notification",
        "es": "Notificación de Consulta"
      },
      "description": {
        "zh-CN": "当收到新询价时发送给供应商",
        "en": "Sent to supplier when receiving new inquiry",
        "es": "Enviado al proveedor al recibir nueva consulta"
      },
      "subject": {
        "zh-CN": "新询价通知 - {{inquiryNumber}}",
        "en": "New Inquiry Notification - {{inquiryNumber}}",
        "es": "Nueva Notificación de Consulta - {{inquiryNumber}}"
      },
      "body": {
        "zh-CN": "<h2>您有新的询价</h2><p>询价编号: {{inquiryNumber}}</p><p>采购商: {{buyerName}}</p>",
        "en": "<h2>You have a new inquiry</h2><p>Inquiry No: {{inquiryNumber}}</p><p>Buyer: {{buyerName}}</p>",
        "es": "<h2>Tiene una nueva consulta</h2><p>No. de consulta: {{inquiryNumber}}</p><p>Comprador: {{buyerName}}</p>"
      },
      "variables": [
        {
          "name": "inquiryNumber",
          "description": "询价编号",
          "example": "INQ-2025-0001"
        },
        {
          "name": "buyerName",
          "description": "采购商名称",
          "example": "ABC公司"
        }
      ],
      "isActive": true,
      "triggerEvent": "inquiry.created",
      "createdAt": "2025-07-30T12:00:00.000Z",
      "updatedAt": "2025-07-30T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### 2.2 创建邮件模板

**请求:**
```http
POST /admin/email-templates
Content-Type: application/json

{
  "code": "inquiry_notification",
  "name": {
    "zh-CN": "询价通知",
    "en": "Inquiry Notification",
    "es": "Notificación de Consulta"
  },
  "description": {
    "zh-CN": "当收到新询价时发送给供应商",
    "en": "Sent to supplier when receiving new inquiry",
    "es": "Enviado al proveedor al recibir nueva consulta"
  },
  "subject": {
    "zh-CN": "新询价通知 - {{inquiryNumber}}",
    "en": "New Inquiry Notification - {{inquiryNumber}}",
    "es": "Nueva Notificación de Consulta - {{inquiryNumber}}"
  },
  "body": {
    "zh-CN": "<h2>您有新的询价</h2><p>询价编号: {{inquiryNumber}}</p><p>采购商: {{buyerName}}</p><p>产品: {{productName}}</p><p>数量: {{quantity}}</p><p>请登录系统查看详情并报价。</p>",
    "en": "<h2>You have a new inquiry</h2><p>Inquiry No: {{inquiryNumber}}</p><p>Buyer: {{buyerName}}</p><p>Product: {{productName}}</p><p>Quantity: {{quantity}}</p><p>Please login to view details and quote.</p>",
    "es": "<h2>Tiene una nueva consulta</h2><p>No. de consulta: {{inquiryNumber}}</p><p>Comprador: {{buyerName}}</p><p>Producto: {{productName}}</p><p>Cantidad: {{quantity}}</p><p>Por favor inicie sesión para ver detalles y cotizar.</p>"
  },
  "variables": [
    {
      "name": "inquiryNumber",
      "description": "询价编号",
      "example": "INQ-2025-0001"
    },
    {
      "name": "buyerName",
      "description": "采购商名称",
      "example": "ABC公司"
    },
    {
      "name": "productName",
      "description": "产品名称",
      "example": "农药产品A"
    },
    {
      "name": "quantity",
      "description": "采购数量",
      "example": "1000吨"
    }
  ],
  "triggerEvent": "inquiry.created"
}
```

### 2.3 更新邮件模板

**请求:**
```http
PUT /admin/email-templates/1
Content-Type: application/json

{
  "subject": {
    "zh-CN": "【重要】新询价通知 - {{inquiryNumber}}",
    "en": "[Important] New Inquiry Notification - {{inquiryNumber}}",
    "es": "[Importante] Nueva Notificación de Consulta - {{inquiryNumber}}"
  },
  "isActive": true
}
```

### 2.4 获取邮件模板详情

**请求:**
```http
GET /admin/email-templates/1
```

### 2.5 删除邮件模板

**请求:**
```http
DELETE /admin/email-templates/1
```

### 2.6 预览邮件模板

**请求:**
```http
POST /admin/email-templates/1/preview
Content-Type: application/json

{
  "variables": {
    "inquiryNumber": "INQ-2025-0001",
    "buyerName": "测试公司",
    "productName": "测试产品",
    "quantity": "100吨"
  },
  "language": "zh-CN"
}
```

**响应示例:**
```json
{
  "subject": "新询价通知 - INQ-2025-0001",
  "body": "<h2>您有新的询价</h2><p>询价编号: INQ-2025-0001</p><p>采购商: 测试公司</p><p>产品: 测试产品</p><p>数量: 100吨</p><p>请登录系统查看详情并报价。</p>"
}
```

### 2.7 获取触发事件列表

**请求:**
```http
GET /admin/email-templates/trigger-events
```

**响应示例:**
```json
[
  "inquiry.created",
  "inquiry.quoted",
  "inquiry.accepted",
  "inquiry.declined",
  "inquiry.expired",
  "sample_request.created",
  "sample_request.approved",
  "sample_request.rejected",
  "sample_request.shipped",
  "sample_request.delivered",
  "registration_request.created",
  "registration_request.processing",
  "registration_request.completed",
  "company.approved",
  "company.rejected",
  "user.welcome",
  "user.password_reset"
]
```

## 三、邮件发送历史

### 3.1 获取邮件发送历史

**请求:**
```http
GET /admin/email-histories?page=1&limit=10&status=sent&startDate=2025-01-01&endDate=2025-12-31
```

**查询参数:**
- `page`: 页码
- `limit`: 每页数量
- `status`: 发送状态 (pending/sending/sent/failed/retry)
- `toEmail`: 收件人邮箱（模糊搜索）
- `relatedType`: 关联类型 (inquiry/sample_request等)
- `relatedId`: 关联ID
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应示例:**
```json
{
  "items": [
    {
      "id": 1,
      "template": {
        "id": 1,
        "code": "inquiry_notification",
        "name": {
          "zh-CN": "询价通知",
          "en": "Inquiry Notification",
          "es": "Notificación de Consulta"
        }
      },
      "config": {
        "id": 1,
        "name": "主邮件服务器",
        "authPass": "******"
      },
      "toEmail": "supplier@example.com",
      "toName": "供应商A",
      "subject": "新询价通知 - INQ-2025-0001",
      "status": "sent",
      "attempts": 1,
      "sentAt": "2025-07-30T12:05:00.000Z",
      "language": "zh-CN",
      "relatedType": "inquiry",
      "relatedId": 123,
      "createdAt": "2025-07-30T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

### 3.2 获取邮件详情

**请求:**
```http
GET /admin/email-histories/1
```

**响应示例:**
```json
{
  "id": 1,
  "templateId": 1,
  "configId": 1,
  "toEmail": "supplier@example.com",
  "toName": "供应商A",
  "ccEmails": ["cc1@example.com"],
  "bccEmails": [],
  "subject": "新询价通知 - INQ-2025-0001",
  "body": "<h2>您有新的询价</h2><p>询价编号: INQ-2025-0001</p>...",
  "variables": {
    "inquiryNumber": "INQ-2025-0001",
    "buyerName": "ABC公司",
    "productName": "农药产品A",
    "quantity": "1000吨"
  },
  "language": "zh-CN",
  "status": "sent",
  "attempts": 1,
  "sentAt": "2025-07-30T12:05:00.000Z",
  "errorMessage": null,
  "relatedType": "inquiry",
  "relatedId": 123,
  "createdBy": 1,
  "createdAt": "2025-07-30T12:00:00.000Z",
  "updatedAt": "2025-07-30T12:05:00.000Z"
}
```

### 3.3 重新发送邮件

**请求:**
```http
POST /admin/email-histories/1/resend
Content-Type: application/json

{
  "configId": 2  // 可选，使用其他邮件配置
}
```

### 3.4 发送邮件

**请求:**
```http
POST /admin/email-histories/send
Content-Type: application/json

{
  "templateId": 1,
  "toEmail": "test@example.com",
  "toName": "测试用户",
  "variables": {
    "inquiryNumber": "INQ-2025-0001",
    "buyerName": "ABC公司",
    "productName": "测试产品",
    "quantity": "100吨"
  },
  "language": "zh-CN",
  "relatedType": "inquiry",
  "relatedId": 123
}
```

或者不使用模板直接发送:
```json
{
  "toEmail": "test@example.com",
  "toName": "测试用户",
  "subject": "测试邮件",
  "body": "<h1>这是一封测试邮件</h1><p>邮件内容...</p>",
  "ccEmails": ["cc@example.com"],
  "language": "zh-CN"
}
```

### 3.5 获取邮件统计信息

**请求:**
```http
GET /admin/email-histories/statistics?days=7
```

**响应示例:**
```json
{
  "statusCounts": [
    { "status": "sent", "count": "150" },
    { "status": "failed", "count": "5" },
    { "status": "pending", "count": "2" }
  ],
  "dailyCounts": [
    { "date": "2025-07-24", "count": "20" },
    { "date": "2025-07-25", "count": "25" },
    { "date": "2025-07-26", "count": "30" },
    { "date": "2025-07-27", "count": "28" },
    { "date": "2025-07-28", "count": "22" },
    { "date": "2025-07-29", "count": "18" },
    { "date": "2025-07-30", "count": "14" }
  ],
  "templateUsage": [
    {
      "templateId": "1",
      "templateCode": "inquiry_notification",
      "templateName": {
        "zh-CN": "询价通知",
        "en": "Inquiry Notification",
        "es": "Notificación de Consulta"
      },
      "count": "89"
    },
    {
      "templateId": "2",
      "templateCode": "sample_request_approved",
      "templateName": {
        "zh-CN": "样品申请批准",
        "en": "Sample Request Approved",
        "es": "Solicitud de Muestra Aprobada"
      },
      "count": "45"
    }
  ],
  "period": {
    "startDate": "2025-07-24T00:00:00.000Z",
    "endDate": "2025-07-30T23:59:59.999Z",
    "days": 7
  }
}
```

## 四、在业务流程中使用邮件功能

### 4.1 询价创建时发送邮件

在询价创建接口中，系统会自动调用邮件服务发送通知:

```typescript
// 示例代码
const emailHistory = await this.emailService.sendEmail({
  templateId: 1, // 使用询价通知模板
  toEmail: supplier.email,
  toName: supplier.name,
  variables: {
    inquiryNumber: inquiry.inquiryNumber,
    buyerName: buyer.name,
    productName: product.name,
    quantity: `${inquiry.quantity} ${inquiry.unit}`
  },
  language: supplier.preferredLanguage || 'zh-CN',
  relatedType: 'inquiry',
  relatedId: inquiry.id
}, currentUser.id);
```

## 五、常见错误处理

### 5.1 邮件配置错误
```json
{
  "statusCode": 400,
  "message": "测试邮件发送失败: Invalid login: 535-5.7.8 Username and Password not accepted",
  "error": "Bad Request"
}
```

### 5.2 模板不存在
```json
{
  "statusCode": 404,
  "message": "邮件模板不存在或已禁用",
  "error": "Not Found"
}
```

### 5.3 缺少必要参数
```json
{
  "statusCode": 400,
  "message": "邮件主题和内容不能为空",
  "error": "Bad Request"
}
```

## 六、注意事项

1. **密码安全**: 邮件配置的密码在返回时会被隐藏为`******`
2. **默认配置**: 系统只能有一个默认邮件配置
3. **模板代码唯一性**: 每个邮件模板的代码必须唯一
4. **变量替换**: 使用`{{variableName}}`格式在模板中定义变量
5. **多语言支持**: 模板支持中文(zh-CN)、英文(en)、西班牙文(es)
6. **重试机制**: 发送失败会自动重试，最多重试次数由配置决定
7. **异步发送**: 邮件发送是异步的，接口返回不代表邮件已发送成功

## 七、测试账号配置示例

### Gmail配置
```json
{
  "name": "Gmail测试",
  "host": "smtp.gmail.com",
  "port": 465,
  "secure": true,
  "authUser": "your-email@gmail.com",
  "authPass": "your-app-password",
  "fromEmail": "your-email@gmail.com",
  "fromName": "ArgoChainHub Test"
}
```

### QQ邮箱配置
```json
{
  "name": "QQ邮箱",
  "host": "smtp.qq.com",
  "port": 465,
  "secure": true,
  "authUser": "your-qq@qq.com",
  "authPass": "your-authorization-code",
  "fromEmail": "your-qq@qq.com",
  "fromName": "ArgoChainHub"
}
```

注意：需要在邮箱设置中开启SMTP服务并获取授权码。