# 采购端询价管理接口文档

本文档描述采购端用户的询价管理相关接口，供前端开发和测试人员使用。

## 基础信息

- **基础URL**: `http://localhost:3050`
- **认证方式**: Bearer Token
- **内容类型**: application/json

## 获取测试Token

```bash
curl -X POST "http://localhost:3050/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "testpass123"
  }'
```

## 接口列表

### 1. 获取我的询价单列表

**接口路径**: `GET /api/v1/inquiries`

**权限要求**: 已登录的采购商或供应商用户

**查询参数**:
- `page`: 页码 (可选, 默认: 1)
- `limit`: 每页条数 (可选, 默认: 20)
- `status`: 询价状态筛选 (可选)
  - `pending_quote`: 待报价
  - `quoted`: 已报价
  - `confirmed`: 已确认
  - `declined`: 已拒绝
  - `cancelled`: 已取消

**请求示例**:
```bash
# 基本查询
curl -X GET "http://localhost:3050/api/v1/inquiries?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按状态筛选
curl -X GET "http://localhost:3050/api/v1/inquiries?status=pending_quote" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例** (新增了 recentMessages 字段):
```json
{
  "success": true,
  "message": "获取询价列表成功",
  "data": [
    {
      "id": "13",
      "createdAt": "2025-08-07T03:58:27.054Z",
      "updatedAt": "2025-08-08T04:50:07.006Z",
      "deletedAt": null,
      "inquiryNo": "INQ1754539104054972",
      "status": "pending_quote",
      "details": {
        "tradeTerms": "FOB",
        "buyerRemarks": "请提供技术规格书",
        "paymentMethod": "T/T",
        "deliveryLocation": "上海",
        "supplierPriority": "normal"
      },
      "quoteDetails": null,
      "deadline": "2025-08-30",
      "buyerId": "24",
      "buyer": {
        "id": "24",
        "createdAt": "2025-08-06T05:05:00.456Z",
        "updatedAt": "2025-08-06T05:05:38.000Z",
        "name": {
          "en": "Test Buyer Company",
          "es": "Empresa Compradora de Prueba",
          "zh-CN": "测试采购公司"
        },
        "type": "buyer",
        "status": "active"
      },
      "supplierId": "11",
      "supplier": {
        "id": "11",
        "name": {
          "en": "Test Supplier Company",
          "zh-CN": "测试供应商企业"
        },
        "type": "supplier",
        "status": "active"
      },
      "items": [
        {
          "id": "10",
          "createdAt": "2025-08-07T03:58:27.117Z",
          "quantity": "100.000",
          "unit": "kg",
          "packagingReq": "25kg袋装",
          "productSnapshot": {
            "name": {
              "en": "Test Pesticide",
              "zh-CN": "测试农药"
            },
            "formulation": "EC",
            "totalContent": "480g/L",
            "pesticideName": {
              "en": "Active Ingredient Name",
              "zh-CN": "有效成分名称"
            }
          },
          "inquiryId": "13",
          "productId": "5"
        }
      ],
      "recentMessages": [
        {
          "id": "15",
          "createdAt": "2025-08-07T10:30:00.000Z",
          "relatedService": "inquiry",
          "relatedId": "13",
          "message": "我们已经收到您的询价单，预计在2个工作日内完成报价。",
          "senderId": "22",
          "sender": {
            "id": "22",
            "email": "supplier@test.com",
            "name": "供应商用户",
            "userType": "supplier",
            "company": {
              "id": "26",
              "name": {
                "en": "Test Supplier Company",
                "zh-CN": "测试供应商企业"
              },
              "type": "supplier"
            }
          }
        }
      ]
    }
  ],
  "meta": {
    "totalItems": 25,
    "currentPage": 1,
    "totalPages": 3,
    "itemsPerPage": 20
  }
}
```

### 2. 创建询价单

**接口路径**: `POST /api/v1/inquiries`

**权限要求**: 仅采购商企业用户可访问

**请求体参数**:
- `supplierId`: 供应商ID (必填)
- `items`: 询价项目数组 (必填)
  - `productId`: 产品ID
  - `quantity`: 数量
  - `unit`: 单位
  - `packagingReq`: 包装要求 (可选)
- `details`: 询价详情 (可选)
  - `tradeTerms`: 贸易条款
  - `paymentMethod`: 付款方式
  - `deliveryLocation`: 交货地点
  - `buyerRemarks`: 买方备注
- `deadline`: 报价截止日期 (必填, 格式: YYYY-MM-DD)

**请求示例**:
```bash
curl -X POST "http://localhost:3050/api/v1/inquiries" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": 11,
    "items": [
      {
        "productId": 5,
        "quantity": 100,
        "unit": "kg",
        "packagingReq": "25kg袋装"
      }
    ],
    "details": {
      "tradeTerms": "FOB",
      "paymentMethod": "T/T",
      "deliveryLocation": "上海",
      "buyerRemarks": "请提供技术规格书"
    },
    "deadline": "2025-12-31"
  }'
```

### 3. 确认报价

**接口路径**: `POST /api/v1/inquiries/:id/confirm`

**权限要求**: 仅该询价单的采购商可访问

**路径参数**:
- `id`: 询价单ID

**请求示例**:
```bash
curl -X POST "http://localhost:3050/api/v1/inquiries/1/confirm" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 拒绝报价

**接口路径**: `POST /api/v1/inquiries/:id/decline`

**权限要求**: 询价单相关方（供应商或采购商）可访问

**路径参数**:
- `id`: 询价单ID

**请求体参数**:
- `reason`: 拒绝原因 (必填)

**请求示例**:
```bash
curl -X POST "http://localhost:3050/api/v1/inquiries/1/decline" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "价格超出预算"
  }'
```

### 5. 取消询价单

**接口路径**: `POST /api/v1/inquiries/:id/cancel`

**权限要求**: 仅该询价单的采购商可访问

**路径参数**:
- `id`: 询价单ID

**请求示例**:
```bash
curl -X POST "http://localhost:3050/api/v1/inquiries/1/cancel" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. 发送询价消息

**接口路径**: `POST /api/v1/inquiries/:id/messages`

**权限要求**: 询价单相关方（供应商或采购商）可访问

**路径参数**:
- `id`: 询价单ID

**请求体参数**:
- `message`: 消息内容 (必填, 最大2000字符)

**请求示例**:
```bash
curl -X POST "http://localhost:3050/api/v1/inquiries/1/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "请问贵公司能否在月底前交货？"
  }'
```

### 7. 获取询价消息历史

**接口路径**: `GET /api/v1/inquiries/:id/messages`

**权限要求**: 询价单相关方（供应商或采购商）可访问

**路径参数**:
- `id`: 询价单ID

**查询参数**:
- `page`: 页码 (可选, 默认: 1)
- `limit`: 每页条数 (可选, 默认: 20)
- `desc`: 是否按时间倒序排列 (可选, 默认: true)

**请求示例**:
```bash
curl -X GET "http://localhost:3050/api/v1/inquiries/1/messages?page=1&limit=10&desc=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 重要更新说明

### recentMessages 字段新增

从最新版本开始，`GET /api/v1/inquiries` 接口响应中新增了 `recentMessages` 字段，与供应端接口保持一致。

**数据结构**:
```typescript
interface RecentMessage {
  id: string;                    // 消息ID
  createdAt: string;            // 创建时间
  relatedService: string;       // 关联服务类型 (固定为"inquiry")
  relatedId: string;           // 关联的询价单ID
  message: string;             // 消息内容
  senderId: string;           // 发送者用户ID
  sender: {                   // 发送者信息
    id: string;               // 用户ID
    email: string;            // 邮箱
    name: string;             // 姓名
    userType: string;         // 用户类型
    company: {                // 企业信息
      id: string;             // 企业ID
      name: {                 // 企业名称(多语言)
        "zh-CN": string;
        "en": string;
      };
      type: string;           // 企业类型 (buyer/supplier)
    };
  };
}
```

**特性**:
- 每个询价单最多返回最近5条消息
- 按创建时间倒序排列
- 包含完整的发送者和企业信息
- 支持采购商和供应商双向消息展示

**前端集成建议**:
1. 在询价单列表中展示最新一条消息的预览
2. 根据发送者企业类型显示不同的消息样式
3. 支持点击跳转到完整消息历史页面
4. 结合WebSocket实时更新消息列表

## WebSocket实时消息推送

采购端和供应端共享同一套WebSocket推送机制，详细文档请参考 [供应端报价管理接口文档](./supplier-quote-management-api.md#websocket实时消息推送)。

**主要事件**:
- `inquiry_message_received`: 收到新的询价消息
- `inquiry_status_updated`: 询价状态发生变化

## 错误响应格式

所有接口遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "statusCode": 400
}
```

## 注意事项

1. 采购端用户只能查看和操作自己创建的询价单
2. 供应端用户只能查看和操作分配给自己企业的询价单  
3. 消息功能支持采购商和供应商双向沟通
4. 新增的 `recentMessages` 字段提高了前端显示效率，减少额外的API调用