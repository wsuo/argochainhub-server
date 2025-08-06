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

### 个人采购商账号（需要企业认证）
- **邮箱**: individual.buyer@test.com
- **密码**: Test123!
- **用户类型**: individual_buyer
- **状态**: 需要企业认证才能访问询价功能

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

### 1.3 个人采购商企业认证流程

个人采购商注册后，需要通过企业认证才能访问询价功能。

#### 1.3.1 个人采购商登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "individual.buyer@test.com",
  "password": "Test123!"
}
```

#### 1.3.2 提交企业认证申请
```http
POST /api/v1/companies/profile/company
Authorization: Bearer <individual_buyer_token>
Content-Type: application/json

{
  "companyName": {
    "zh-CN": "上海化工贸易有限公司",
    "en": "Shanghai Chemical Trading Co., Ltd.",
    "es": "Shanghai Chemical Trading Co., Ltd."
  },
  "businessScope": {
    "zh-CN": "专业从事农药、化肥等农化产品的采购与贸易业务",
    "en": "Professional in procurement and trading of pesticides, fertilizers and other agrochemical products",
    "es": "Profesional en adquisición y comercio de pesticidas, fertilizantes y otros productos agroquímicos"
  },
  "mainProducts": {
    "zh-CN": "除草剂、杀虫剂、杀菌剂采购",
    "en": "Herbicides, Insecticides, Fungicides procurement",
    "es": "Adquisición de herbicidas, insecticidas, fungicidas"
  },
  "mainSuppliers": {
    "zh-CN": "先正达、拜耳作物科学、巴斯夫",
    "en": "Syngenta, Bayer Crop Science, BASF",
    "es": "Syngenta, Bayer Crop Science, BASF"
  },
  "companySize": "medium",
  "country": "cn",
  "businessCategories": ["domestic_trade", "international_trade"],
  "phone": "+86-21-12345678",
  "address": "上海市浦东新区张江高科技园区",
  "website": "https://www.shanghai-chem.com",
  "registrationNumber": "91310000123456789X",
  "taxNumber": "310000123456789",
  "annualImportExportValue": 1500000.00,
  "businessLicenseUrl": "https://example.com/license.jpg",
  "companyPhotosUrls": ["https://example.com/office1.jpg", "https://example.com/warehouse.jpg"]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "企业认证申请提交成功，请等待管理员审核通过",
  "data": {
    "id": "23",
    "name": {
      "zh-CN": "上海化工贸易有限公司",
      "en": "Shanghai Chemical Trading Co., Ltd.",
      "es": "Shanghai Chemical Trading Co., Ltd."
    },
    "type": "buyer",
    "status": "pending_review"
  }
}
```

#### 1.3.3 管理员审核通过
管理员将企业状态更新为 `active` 后，用户可以重新登录获取新的token：

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "individual.buyer@test.com",
  "password": "Test123!"
}
```

**认证后的响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "20",
      "email": "individual.buyer@test.com",
      "name": "个人采购商张三",
      "userType": "individual_buyer",
      "company": {
        "id": "23",
        "name": {"zh-CN": "上海化工贸易有限公司"},
        "type": "buyer",
        "status": "active"
      }
    }
  }
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

#### 标准企业用户流程
1. **采购商发起询价** → 系统创建询价记录
2. **采购商发送询价消息** → 说明采购需求
3. **供应商查看询价** → 了解具体要求
4. **供应商发送回复消息** → 提供初步报价信息
5. **供应商正式报价** → 更新询价状态为 `quoted`
6. **采购商查看报价** → 通过消息进一步讨论细节
7. **采购商确认订单** → 更新询价状态为 `confirmed`
8. **双方继续沟通** → 关于合同、发货等细节

#### 个人采购商认证流程
1. **个人采购商注册** → 用户类型为 `individual_buyer`
2. **尝试访问询价** → 收到403错误："User must be associated with a company to access inquiries"
3. **提交企业认证申请** → 通过 `POST /api/v1/companies/profile/company` 接口
4. **等待管理员审核** → 企业状态为 `pending_review`
5. **管理员审核通过** → 企业状态更新为 `active`
6. **重新登录获取新token** → token包含企业信息
7. **正常访问询价功能** → 可以创建询价、发送消息等

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

### 5.1 询价列表接口 (`GET /api/v1/inquiries`) 错误类型

**HTTP 400 Bad Request:**
- 请求参数格式错误（分页参数非数字等）

**HTTP 401 Unauthorized:**
- 未提供有效的JWT token
- Token已过期或无效

**HTTP 403 Forbidden:**
- `"User must be associated with a company to access inquiries"` - 用户未关联公司（个人采购商需要企业认证）
- `"Invalid company type for inquiry access"` - 公司类型无效（非采购商或供应商）
- `"Company status must be active to access inquiries"` - 公司状态必须为active（企业认证未通过）

**HTTP 500 Internal Server Error:**
- 服务器内部错误

### 5.2 询价详情接口 (`GET /api/v1/inquiries/{id}`) 错误类型

**HTTP 401 Unauthorized:**
- 未提供有效的JWT token

**HTTP 403 Forbidden:**
- `"You do not have permission to access this inquiry"` - 无权限访问此询价（不是该询价的买家或卖家）

**HTTP 404 Not Found:**
- `"Inquiry not found"` - 询价不存在

### 5.3 发送消息接口 (`POST /api/v1/inquiries/{id}/messages`) 错误类型

**HTTP 400 Bad Request:**
- 消息内容为空或超过长度限制

**HTTP 401 Unauthorized:**
- 未提供有效的JWT token

**HTTP 403 Forbidden:**
- 无权限访问该询价（继承询价访问权限）

**HTTP 404 Not Found:**
- 询价不存在

### 5.4 创建询价接口 (`POST /api/v1/inquiries`) 错误类型

**HTTP 400 Bad Request:**
- `"Invalid inquiry item: missing required product information"` - 询价项目缺少必要产品信息
- `"Quote deadline must be in the future"` - 报价截止时间必须是未来时间

**HTTP 403 Forbidden:**
- `"Only buyers can create inquiries"` - 只有采购商可以创建询价

**HTTP 404 Not Found:**
- `"Supplier not found or inactive"` - 供应商不存在或未激活

### 5.5 供应商报价接口 (`PATCH /api/v1/inquiries/{id}/quote`) 错误类型

**HTTP 400 Bad Request:**
- `"Cannot quote inquiry with status 'xxx'"` - 当前状态不允许报价
- `"Quote deadline has passed"` - 报价截止时间已过

**HTTP 403 Forbidden:**
- `"Only the supplier can quote this inquiry"` - 只有指定供应商可以报价

**HTTP 404 Not Found:**
- 询价不存在

### 5.6 确认询价接口 (`PATCH /api/v1/inquiries/{id}/confirm`) 错误类型

**HTTP 400 Bad Request:**
- `"Cannot confirm inquiry with status 'xxx'"` - 当前状态不允许确认

**HTTP 403 Forbidden:**
- `"Only the buyer can confirm this inquiry"` - 只有采购商可以确认

### 5.7 拒绝询价接口 (`PATCH /api/v1/inquiries/{id}/decline`) 错误类型

**HTTP 400 Bad Request:**
- `"Cannot decline inquiry with status 'xxx'"` - 当前状态不允许拒绝

**HTTP 403 Forbidden:**
- `"Only buyer or supplier can decline this inquiry"` - 只有买家或卖家可以拒绝

### 5.8 取消询价接口 (`PATCH /api/v1/inquiries/{id}/cancel`) 错误类型

**HTTP 400 Bad Request:**
- `"Cannot cancel inquiry with status 'xxx'"` - 当前状态不允许取消

**HTTP 403 Forbidden:**
- `"Only the buyer can cancel this inquiry"` - 只有采购商可以取消

### 5.9 常见解决方案

**403 权限错误解决方法:**
1. 确保用户已登录且token有效
2. 确认用户已关联公司且公司状态为`active`
3. 确认用户公司类型正确（采购商/供应商）
4. 确认用户有权限访问特定询价

**个人采购商企业认证解决方案:**
1. 用户类型为 `individual_buyer` 的用户需要先进行企业认证
2. 通过 `POST /api/v1/companies/profile/company` 提交认证申请
3. 等待管理员审核通过（企业状态变为 `active`）
4. 重新登录获取包含企业信息的新token
5. 企业认证后可正常访问询价功能

**认证流程:**
1. 用户必须先登录获取token
2. 个人采购商必须先完成企业认证
3. 用户必须关联已激活的公司
4. 公司类型必须是`buyer`或`supplier`
5. 只能访问与自己公司相关的询价

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

# 个人采购商登录
curl -X POST http://localhost:3050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"individual.buyer@test.com","password":"Test123!"}'
```

### A.2 个人采购商企业认证测试
```bash
# 设置个人采购商Token
INDIVIDUAL_BUYER_TOKEN="your_individual_buyer_token_here"

# 提交企业认证申请
curl -X POST http://localhost:3050/api/v1/companies/profile/company \
  -H "Authorization: Bearer $INDIVIDUAL_BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": {
      "zh-CN": "上海化工贸易有限公司",
      "en": "Shanghai Chemical Trading Co., Ltd.",
      "es": "Shanghai Chemical Trading Co., Ltd."
    },
    "businessScope": {
      "zh-CN": "专业从事农药、化肥等农化产品的采购与贸易业务",
      "en": "Professional in procurement and trading of pesticides, fertilizers and other agrochemical products",
      "es": "Profesional en adquisición y comercio de pesticidas, fertilizantes y otros productos agroquímicos"
    },
    "mainProducts": {
      "zh-CN": "除草剂、杀虫剂、杀菌剂采购",
      "en": "Herbicides, Insecticides, Fungicides procurement",
      "es": "Adquisición de herbicidas, insecticidas, fungicidas"
    },
    "mainSuppliers": {
      "zh-CN": "先正达、拜耳作物科学、巴斯夫",
      "en": "Syngenta, Bayer Crop Science, BASF",
      "es": "Syngenta, Bayer Crop Science, BASF"
    },
    "companySize": "medium",
    "country": "cn",
    "businessCategories": ["domestic_trade", "international_trade"],
    "phone": "+86-21-12345678",
    "address": "上海市浦东新区张江高科技园区",
    "website": "https://www.shanghai-chem.com",
    "registrationNumber": "91310000123456789X",
    "taxNumber": "310000123456789",
    "annualImportExportValue": 1500000.00,
    "businessLicenseUrl": "https://example.com/license.jpg",
    "companyPhotosUrls": ["https://example.com/office1.jpg", "https://example.com/warehouse.jpg"]
  }'

# 认证前访问询价（应返回403错误）
curl -X GET http://localhost:3050/api/v1/inquiries \
  -H "Authorization: Bearer $INDIVIDUAL_BUYER_TOKEN"

# 管理员审核通过后，重新登录获取新Token
curl -X POST http://localhost:3050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"individual.buyer@test.com","password":"Test123!"}'

# 使用新Token访问询价（应正常返回）
NEW_TOKEN="new_token_after_certification"
curl -X GET http://localhost:3050/api/v1/inquiries \
  -H "Authorization: Bearer $NEW_TOKEN"
```

### A.3 核心功能测试
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