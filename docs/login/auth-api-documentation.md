# 用户认证接口文档

## 概述

本文档描述了支持个人采购商和供应商企业用户的注册登录接口。系统支持两种用户类型：
- **个人采购商** (`individual_buyer`)：不绑定企业，注册后立即可用
- **供应商企业用户** (`supplier`)：绑定企业，需要审核通过后才能使用

## 基础信息

- **服务地址**: `http://localhost:3050`
- **API 前缀**: `/api/v1/auth`
- **Content-Type**: `application/json`

## 1. 用户注册

### 1.1 个人采购商注册

**接口地址**: `POST /api/v1/auth/register`

**请求示例**:
```json
{
  "email": "buyer@example.com",
  "password": "password123",
  "userName": "张三",
  "userType": "individual_buyer"
}
```

**请求参数**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址，全局唯一 |
| password | string | 是 | 密码，最少6位 |
| userName | string | 是 | 用户姓名 |
| userType | string | 是 | 用户类型，固定值 "individual_buyer" |

**成功响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "message": "个人采购商注册成功，您可以立即开始使用平台",
    "userType": "individual_buyer",
    "needsApproval": false
  }
}
```

### 1.2 供应商注册

**接口地址**: `POST /api/v1/auth/register`

**请求示例**:
```json
{
  "email": "supplier@example.com",
  "password": "password123",
  "userName": "李四",
  "userType": "supplier",
  "companyName": {
    "zh-CN": "环球农化股份有限公司",
    "en": "Global Agrochem Inc.",
    "es": "Global Agrochem S.A."
  },
  "companyType": "supplier",
  "country": "cn",
  "businessCategories": ["pesticide_supplier", "fertilizer_supplier"],
  "businessScope": {
    "zh-CN": "专业从事农药、化肥等农化产品的研发、生产和销售",
    "en": "Professional in R&D, production and sales of pesticides, fertilizers and other agrochemical products"
  },
  "companySize": "medium",
  "mainProducts": {
    "zh-CN": "除草剂、杀虫剂、杀菌剂、植物生长调节剂",
    "en": "Herbicides, Insecticides, Fungicides, Plant Growth Regulators"
  },
  "annualImportExportValue": 5000000.00,
  "registrationNumber": "REG123456789",
  "taxNumber": "TAX987654321",
  "businessLicenseUrl": "https://example.com/business-license.jpg",
  "companyPhotosUrls": [
    "https://example.com/office1.jpg",
    "https://example.com/factory1.jpg"
  ]
}
```

**请求参数**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址，全局唯一 |
| password | string | 是 | 密码，最少6位 |
| userName | string | 是 | 用户姓名 |
| userType | string | 是 | 用户类型，固定值 "supplier" |
| companyName | object | 是 | 企业名称（多语言） |
| companyType | string | 否 | 企业类型，默认为 "supplier" |
| country | string | 否 | 国家代码 |
| businessCategories | array | 否 | 业务类别代码列表 |
| businessScope | object | 否 | 业务范围描述（多语言） |
| companySize | string | 否 | 公司规模: startup/small/medium/large/enterprise |
| mainProducts | object | 否 | 主要产品（多语言） |
| mainSuppliers | object | 否 | 主要供应商（多语言） |
| annualImportExportValue | number | 否 | 年进口/出口额（美元） |
| registrationNumber | string | 否 | 注册证号 |
| taxNumber | string | 否 | 税号 |
| businessLicenseUrl | string | 否 | 营业执照图片地址 |
| companyPhotosUrls | array | 否 | 公司照片地址列表 |

**成功响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "message": "供应商注册成功，请等待审核通过后使用",
    "userType": "supplier",
    "needsApproval": true
  }
}
```

### 1.3 注册错误响应

**邮箱已存在**:
```json
{
  "message": "邮箱已存在",
  "error": "Conflict",
  "statusCode": 409
}
```

**供应商未提供企业名称**:
```json
{
  "message": "供应商注册必须提供企业名称",
  "error": "Bad Request",
  "statusCode": 400
}
```

## 2. 用户登录

### 2.1 登录接口

**接口地址**: `POST /api/v1/auth/login`

**请求示例**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**请求参数**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 注册邮箱 |
| password | string | 是 | 密码 |

### 2.2 个人采购商登录成功响应

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "14",
      "email": "buyer@test.com",
      "name": "测试采购商",
      "userType": "individual_buyer",
      "role": "member",
      "company": null
    }
  }
}
```

### 2.3 供应商登录成功响应

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "15",
      "email": "supplier@test.com",
      "name": "测试供应商用户",
      "userType": "supplier",
      "role": "owner",
      "company": {
        "id": "20",
        "name": {
          "en": "Test Agrochem Company",
          "zh-CN": "测试农化公司"
        },
        "type": "supplier",
        "status": "active"
      }
    }
  }
}
```

### 2.4 登录错误响应

**用户不存在或账户未激活**:
```json
{
  "message": "用户不存在或账户未激活",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**密码错误**:
```json
{
  "message": "密码错误",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**企业尚未通过审核（供应商）**:
```json
{
  "message": "企业尚未通过审核，请等待审核完成",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## 3. 获取当前用户信息

### 3.1 获取用户信息

**接口地址**: `GET /api/v1/auth/me`

**请求头**:
```
Authorization: Bearer {accessToken}
```

### 3.2 个人采购商用户信息响应

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": "14",
    "email": "buyer@test.com",
    "name": "测试采购商",
    "userType": "individual_buyer",
    "role": "member",
    "lastLoginAt": "2025-08-03T09:51:12.000Z",
    "type": "user",
    "company": null
  }
}
```

### 3.3 供应商用户信息响应

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": "15",
    "email": "supplier@test.com",
    "name": "测试供应商用户",
    "userType": "supplier",
    "role": "owner",
    "lastLoginAt": "2025-08-03T09:53:37.000Z",
    "type": "user",
    "company": {
      "id": "20",
      "name": {
        "en": "Test Agrochem Company",
        "zh-CN": "测试农化公司"
      },
      "type": "supplier",
      "status": "active",
      "profile": null,
      "rating": null,
      "isTop100": false,
      "country": "cn",
      "businessCategories": ["pesticide_supplier"],
      "businessScope": {
        "en": "Pesticide R&D, production and sales",
        "zh-CN": "农药研发生产销售"
      },
      "companySize": null,
      "mainProducts": null,
      "mainSuppliers": null,
      "annualImportExportValue": null,
      "registrationNumber": null,
      "taxNumber": null,
      "businessLicenseUrl": null,
      "companyPhotosUrls": null
    }
  }
}
```

## 4. JWT Token 说明

### 4.1 Token 载荷字段

| 字段 | 类型 | 说明 |
|------|------|------|
| sub | string | 用户ID |
| email | string | 用户邮箱 |
| companyId | string/null | 企业ID，个人采购商为 null |
| companyType | string/null | 企业类型，个人采购商为 null |
| userType | string | 用户类型: individual_buyer/supplier |
| role | string | 用户角色: member/owner |
| iat | number | 签发时间 |
| exp | number | 过期时间 |

### 4.2 Token 示例

**个人采购商 Token**:
```json
{
  "sub": "14",
  "email": "buyer@test.com",
  "companyId": null,
  "companyType": null,
  "userType": "individual_buyer",
  "role": "member",
  "iat": 1754214671,
  "exp": 1754819471
}
```

**供应商 Token**:
```json
{
  "sub": "15",
  "email": "supplier@test.com",
  "companyId": "20",
  "companyType": "supplier",
  "userType": "supplier",
  "role": "owner",
  "iat": 1754214816,
  "exp": 1754819616
}
```

## 5. 枚举值说明

### 5.1 用户类型 (userType)
- `individual_buyer`: 个人采购商
- `supplier`: 供应商企业用户

### 5.2 企业类型 (companyType)
- `buyer`: 采购商企业
- `supplier`: 供应商企业

### 5.3 企业规模 (companySize)
- `startup`: 初创企业 (1-10人)
- `small`: 小型企业 (11-50人)
- `medium`: 中型企业 (51-200人)
- `large`: 大型企业 (201-1000人)
- `enterprise`: 大型集团 (1000+人)

### 5.4 企业状态 (company.status)
- `pending_review`: 等待审核
- `active`: 已激活
- `disabled`: 已禁用

### 5.5 用户角色 (role)
- `owner`: 企业所有者
- `admin`: 企业管理员
- `member`: 普通成员

## 6. 错误码说明

| 状态码 | 错误类型 | 说明 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 认证失败 |
| 409 | Conflict | 邮箱已存在 |
| 500 | Internal Server Error | 服务器内部错误 |

## 7. 注意事项

1. **邮箱唯一性**: 每个邮箱只能注册一个账号
2. **供应商审核**: 供应商注册后需要等待管理员审核通过才能登录
3. **个人采购商**: 注册后立即可用，无需审核
4. **Token 有效期**: 7天（604800秒）
5. **多语言支持**: 企业相关字段支持多语言，至少需要提供中文
6. **文件上传**: 营业执照和企业照片需要先上传文件获取URL

## 8. 前端开发建议

1. **注册表单**: 根据用户选择的类型（个人采购商/供应商）显示不同的表单字段
2. **状态管理**: 在本地存储用户类型，用于控制功能权限
3. **错误处理**: 根据返回的错误码和消息给用户友好提示
4. **Token 管理**: 妥善保存和管理 JWT Token
5. **企业信息**: 供应商用户需要展示完整的企业信息

## 9. 测试用例

### 9.1 个人采购商注册测试
```bash
curl -X POST http://localhost:3050/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "password123",
    "userName": "测试采购商",
    "userType": "individual_buyer"
  }'
```

### 9.2 供应商注册测试
```bash
curl -X POST http://localhost:3050/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supplier@test.com",
    "password": "password123",
    "userName": "测试供应商用户",
    "userType": "supplier",
    "companyName": {
      "zh-CN": "测试农化公司",
      "en": "Test Agrochem Company"
    }
  }'
```

### 9.3 登录测试
```bash
curl -X POST http://localhost:3050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "password123"
  }'
```

### 9.4 获取用户信息测试
```bash
curl -X GET http://localhost:3050/api/v1/auth/me \
  -H "Authorization: Bearer {your_token_here}"
```