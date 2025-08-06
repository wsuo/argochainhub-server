# 采购端询价管理模块 API 测试文档

## 概述
本文档描述采购端询价管理模块的所有接口，包括询价的创建、查看、消息回复等功能。系统采用通用的消息回复架构，支持询价、样品管理、登记管理等多种业务场景。

## 测试环境
- **服务地址**: http://localhost:3050
- **API基础路径**: /api/v1
- **认证方式**: Bearer Token

## 测试账号

### 采购商账号
- **邮箱**: buyer@test.com
- **密码**: Test123!
- **公司**: 北京采购有限公司
- **状态**: 已认证 (active)

### 供应商账号
- **邮箱**: supplier@test.com
- **密码**: Test123!
- **公司**: 上海农药供应商
- **状态**: 已认证 (active)

## 测试数据
系统已创建3条测试询价记录：
1. **询价ID 5** - 状态: `pending_quote` (等待报价)
2. **询价ID 6** - 状态: `quoted` (已报价)
3. **询价ID 7** - 状态: `confirmed` (已确认)

---

## 1. 用户认证

### 1.1 采购商登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "buyer@test.com",
  "password": "Test123!"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "18",
      "email": "buyer@test.com",
      "name": "采购经理张三",
      "company": {
        "id": "21",
        "name": {"zh": "北京采购有限公司", "en": "Beijing Buyer Co., Ltd."},
        "type": "buyer",
        "status": "active"
      }
    }
  }
}
```

### 1.2 供应商登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "supplier@test.com",
  "password": "Test123!"
}
```

---

## 2. 询价管理接口

### 2.1 获取我的询价列表
**接口**: `GET /api/v1/inquiries`
**权限**: 需要登录，采购商和供应商都可以访问
**说明**: 采购商看到自己发起的询价，供应商看到收到的询价

```http
GET /api/v1/inquiries?page=1&limit=20&status=pending_quote
Authorization: Bearer <token>
```

**请求参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20
- `status` (可选): 询价状态筛选

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": "7",
      "inquiryNo": "INQ1754447643003",
      "status": "confirmed",
      "details": {
        "deliveryLocation": "天津港",
        "tradeTerms": "CIF",
        "paymentMethod": "T/T 30天",
        "buyerRemarks": "第二次合作，质量很满意"
      },
      "quoteDetails": {
        "totalPrice": 95000,
        "validUntil": "2025-01-16T00:00:00.000Z",
        "supplierRemarks": "老客户价格，质量保证"
      },
      "deadline": "2025-08-31",
      "buyer": {
        "id": "21",
        "name": {"zh": "北京采购有限公司"},
        "type": "buyer"
      },
      "supplier": {
        "id": "22",
        "name": {"zh": "上海农药供应商"},
        "type": "supplier"
      },
      "items": [
        {
          "id": "9",
          "quantity": "1000.000",
          "unit": "kg",
          "packagingReq": "25kg/袋，木托盘",
          "productSnapshot": {
            "name": {"zh": "草甘膦原药"},
            "formulation": "TC",
            "totalContent": "95%"
          }
        }
      ]
    }
  ],
  "meta": {
    "totalItems": 3,
    "currentPage": 1,
    "totalPages": 1,
    "itemsPerPage": 20
  }
}
```

### 2.2 获取询价详情（包含消息记录）
**接口**: `GET /api/v1/inquiries/{id}`
**权限**: 需要登录，只能查看自己相关的询价

```http
GET /api/v1/inquiries/7
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取询价单详情成功",
  "data": {
    "id": "7",
    "inquiryNo": "INQ1754447643003",
    "status": "confirmed",
    "details": {
      "deliveryLocation": "天津港",
      "tradeTerms": "CIF",
      "paymentMethod": "T/T 30天",
      "buyerRemarks": "第二次合作，质量很满意"
    },
    "quoteDetails": {
      "totalPrice": 95000,
      "validUntil": "2025-01-16T00:00:00.000Z",
      "supplierRemarks": "老客户价格，质量保证"
    },
    "deadline": "2025-08-31",
    "buyer": { "...": "采购商信息" },
    "supplier": { "...": "供应商信息" },
    "items": [ "...产品明细..." ],
    "recentMessages": [
      {
        "id": "11",
        "message": "我们也很期待与贵公司长期合作，互利共赢！",
        "senderId": "19",
        "createdAt": "2025-08-06T02:37:41.679Z",
        "sender": {
          "id": "19",
          "name": "销售经理李四",
          "company": {
            "name": {"zh": "上海农药供应商"}
          }
        }
      },
      {
        "id": "10",
        "message": "感谢您的支持，期待长期合作！",
        "senderId": "18",
        "createdAt": "2025-08-06T02:37:25.757Z",
        "sender": {
          "id": "18",
          "name": "采购经理张三",
          "company": {
            "name": {"zh": "北京采购有限公司"}
          }
        }
      }
    ]
  }
}
```

### 2.3 发送询价消息
**接口**: `POST /api/v1/inquiries/{id}/messages`
**权限**: 需要登录，只能在自己相关的询价中发送消息

```http
POST /api/v1/inquiries/7/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "感谢您的支持，期待长期合作！"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "消息发送成功",
  "data": {
    "id": "10",
    "relatedService": "inquiry",
    "relatedId": 7,
    "message": "感谢您的支持，期待长期合作！",
    "senderId": "18",
    "createdAt": "2025-08-06T02:37:25.757Z"
  }
}
```

### 2.4 获取询价消息历史
**接口**: `GET /api/v1/inquiries/{id}/messages`
**权限**: 需要登录，只能查看自己相关询价的消息

```http
GET /api/v1/inquiries/7/messages?page=1&limit=20&desc=true
Authorization: Bearer <token>
```

**请求参数**:
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认20
- `desc` (可选): 是否倒序排列，默认true

**响应示例**:
```json
{
  "success": true,
  "message": "获取消息历史成功",
  "data": [
    {
      "id": "11",
      "relatedService": "inquiry",
      "relatedId": "7",
      "message": "我们也很期待与贵公司长期合作，互利共赢！",
      "senderId": "19",
      "createdAt": "2025-08-06T02:37:41.679Z",
      "sender": {
        "id": "19",
        "name": "销售经理李四",
        "userType": "supplier",
        "company": {
          "id": "22",
          "name": {"zh": "上海农药供应商"},
          "type": "supplier"
        }
      }
    }
  ],
  "meta": {
    "totalItems": 7,
    "currentPage": 1,
    "totalPages": 1,
    "itemsPerPage": 20
  }
}
```

---

## 3. 业务流程测试

### 3.1 完整的询价沟通流程
1. **采购商发起询价** → 系统创建询价记录
2. **采购商发送询价消息** → 说明采购需求
3. **供应商查看询价** → 了解具体要求
4. **供应商发送回复消息** → 提供初步报价信息
5. **供应商正式报价** → 更新询价状态为 `quoted`
6. **采购商查看报价** → 通过消息进一步讨论细节
7. **采购商确认订单** → 更新询价状态为 `confirmed`
8. **双方继续沟通** → 关于合同、发货等细节

### 3.2 消息系统特点
- ✅ **通用设计**: 支持 inquiry、sample、registration 三种业务类型
- ✅ **实时沟通**: 支持采购商和供应商双向消息
- ✅ **历史记录**: 完整保存沟通记录，支持分页查询
- ✅ **权限控制**: 只有相关方才能查看和发送消息
- ✅ **用户信息**: 消息包含发送者完整信息，便于识别

---

## 4. 状态说明

### 4.1 询价状态 (InquiryStatus)
- `pending_quote`: 等待报价
- `quoted`: 已报价
- `confirmed`: 已确认
- `declined`: 已拒绝
- `expired`: 已过期
- `cancelled`: 已取消

### 4.2 公司认证状态 (CompanyStatus)
- `pending_review`: 待审核
- `active`: 已激活（可正常使用）
- `disabled`: 已禁用

---

## 5. 错误处理

### 5.1 常见错误码
- `400`: 请求参数错误
- `401`: 未授权（token无效或过期）
- `403`: 权限不足（公司未认证或角色不匹配）
- `404`: 资源不存在（询价不存在）
- `500`: 服务器内部错误

### 5.2 权限检查
- 只有已认证的公司（status = 'active'）才能参与询价业务
- 采购商只能查看自己发起的询价
- 供应商只能查看发送给自己的询价
- 消息系统严格按照询价权限控制

---

## 6. 测试总结

### 6.1 已实现功能
✅ 采购商询价列表查询（支持状态筛选、分页）
✅ 询价详情查询（包含最近5条消息预览）
✅ 通用消息回复系统（支持双向沟通）
✅ 消息历史记录查询（支持分页、排序）
✅ 完整的权限控制和认证检查
✅ 统一的API返回格式（ResponseWrapperUtil）

### 6.2 系统特色
1. **通用消息架构**: Communication实体支持多业务场景复用
2. **完整权限控制**: 基于用户-公司关联的细粒度权限管理
3. **丰富的业务数据**: 包含产品快照、公司信息、用户信息等
4. **标准化响应**: 统一的成功/错误响应格式
5. **扩展性强**: 易于支持样品管理、登记管理等其他业务模块

### 6.3 测试数据概览
- **2个测试公司**: 1个采购商 + 1个供应商
- **2个测试用户**: 采购经理 + 销售经理
- **2个测试产品**: 草甘膦原药 + 阿维菌素乳油
- **3条测试询价**: 不同状态的完整业务流程
- **11条测试消息**: 完整的沟通记录链

---

## 附录：快速测试脚本

### A.1 获取Token
```bash
# 采购商登录
curl -X POST http://localhost:3050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"Test123!"}'

# 供应商登录  
curl -X POST http://localhost:3050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supplier@test.com","password":"Test123!"}'
```

### A.2 核心功能测试
```bash
# 设置Token
BUYER_TOKEN="your_buyer_token_here"
SUPPLIER_TOKEN="your_supplier_token_here"

# 获取询价列表
curl -X GET "http://localhost:3050/api/v1/inquiries" \
  -H "Authorization: Bearer $BUYER_TOKEN"

# 查看询价详情
curl -X GET "http://localhost:3050/api/v1/inquiries/7" \
  -H "Authorization: Bearer $BUYER_TOKEN"

# 发送消息
curl -X POST "http://localhost:3050/api/v1/inquiries/7/messages" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "测试消息内容"}'

# 获取消息历史
curl -X GET "http://localhost:3050/api/v1/inquiries/7/messages" \
  -H "Authorization: Bearer $BUYER_TOKEN"
```