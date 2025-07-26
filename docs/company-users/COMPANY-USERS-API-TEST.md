# 企业用户管理接口测试文档

## 接口概述

本文档涵盖企业用户管理的所有接口，包括企业端的用户管理和管理员端的用户查询功能。

## 认证说明

所有接口都需要Bearer Token认证，请在请求头中添加：
```
Authorization: Bearer {your_token}
```

---

## 企业端用户管理接口

### 1. 获取企业用户列表

**接口地址**: `GET /api/v1/companies/{companyId}/users`

**权限要求**: 企业Owner和Admin可以查看所有用户，Member只能查看自己

**请求参数**:
- companyId (path): 企业ID

**查询参数**:
```json
{
  "page": 1,
  "limit": 20,
  "search": "用户搜索关键词",
  "role": "owner|admin|member",
  "department": "部门名称",
  "position": "职位名称",
  "isActive": true,
  "emailVerified": true,
  "joinedStartDate": "2025-01-01",
  "joinedEndDate": "2025-12-31",
  "sortBy": "createdAt|updatedAt|name|joinedAt",
  "sortOrder": "ASC|DESC"
}
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "6",
      "createdAt": "2025-07-13T22:24:27.591+08:00",
      "updatedAt": "2025-07-13T22:24:27.795+08:00",
      "deletedAt": null,
      "email": "supplier2.owner@huanong-bio.com",
      "name": "赵永强",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "position": "总经理",
      "department": "管理层",
      "joinedAt": "2025-01-01",
      "emailVerified": true,
      "role": "owner",
      "isActive": true,
      "lastLoginAt": null,
      "companyId": "3",
      "company": {
        "id": "3",
        "name": {
          "zh-CN": "华农生物科技集团",
          "en": "HuaNong Biotechnology Group"
        }
      }
    }
  ],
  "meta": {
    "totalItems": 1,
    "itemCount": 1,
    "itemsPerPage": 20,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

**测试用例**:
```bash
# 获取企业3的用户列表
curl -X GET "http://localhost:3010/api/v1/companies/3/users?page=1&limit=10" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# 搜索用户
curl -X GET "http://localhost:3010/api/v1/companies/3/users?search=赵永强" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# 按部门筛选
curl -X GET "http://localhost:3010/api/v1/companies/3/users?department=技术部" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

### 2. 获取企业用户详情

**接口地址**: `GET /api/v1/companies/{companyId}/users/{userId}`

**权限要求**: 企业Owner和Admin可以查看所有用户，Member只能查看自己

**请求参数**:
- companyId (path): 企业ID
- userId (path): 用户ID

**响应示例**:
```json
{
  "id": "6",
  "createdAt": "2025-07-13T22:24:27.591+08:00",
  "updatedAt": "2025-07-13T22:24:27.795+08:00",
  "deletedAt": null,
  "email": "supplier2.owner@huanong-bio.com",
  "name": "赵永强",
  "phone": "13800138000",
  "avatar": "https://example.com/avatar.jpg",
  "position": "总经理",
  "department": "管理层",
  "joinedAt": "2025-01-01",
  "emailVerified": true,
  "role": "owner",
  "isActive": true,
  "lastLoginAt": null,
  "companyId": "3",
  "company": {
    "id": "3",
    "name": {
      "zh-CN": "华农生物科技集团",
      "en": "HuaNong Biotechnology Group"
    }
  }
}
```

**测试用例**:
```bash
# 获取用户详情
curl -X GET "http://localhost:3010/api/v1/companies/3/users/6" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

### 3. 创建企业用户

**接口地址**: `POST /api/v1/companies/{companyId}/users`

**权限要求**: 企业Owner和Admin可以创建用户

**请求参数**:
- companyId (path): 企业ID

**请求体**:
```json
{
  "email": "newuser@example.com",
  "name": "新用户",
  "password": "password123",
  "phone": "13900139000",
  "avatar": "https://example.com/avatar.jpg",
  "position": "产品经理",
  "department": "产品部",
  "joinedAt": "2025-01-15",
  "role": "member",
  "isActive": true
}
```

**字段说明**:
- email: 邮箱地址（必填，唯一）
- name: 用户姓名（必填，2-50字符）
- password: 初始密码（必填，至少6字符）
- phone: 电话号码（可选）
- avatar: 头像URL（可选）
- position: 职位（可选，最多100字符）
- department: 部门（可选，最多100字符）
- joinedAt: 入职时间（可选，默认当前日期）
- role: 用户角色（必填，owner/admin/member，默认member）
- isActive: 是否激活（可选，默认true）

**响应示例**:
```json
{
  "id": "7",
  "createdAt": "2025-07-26T20:00:00.000+08:00",
  "updatedAt": "2025-07-26T20:00:00.000+08:00",
  "deletedAt": null,
  "email": "newuser@example.com",
  "name": "新用户",
  "phone": "13900139000",
  "avatar": "https://example.com/avatar.jpg",
  "position": "产品经理",
  "department": "产品部",
  "joinedAt": "2025-01-15",
  "emailVerified": false,
  "role": "member",
  "isActive": true,
  "lastLoginAt": null,
  "companyId": "3"
}
```

**测试用例**:
```bash
# 创建新用户
curl -X POST "http://localhost:3010/api/v1/companies/3/users" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "测试用户",
    "password": "password123",
    "phone": "13800138001",
    "position": "开发工程师",
    "department": "技术部",
    "role": "member"
  }'

# 创建管理员用户（需要Owner权限）
curl -X POST "http://localhost:3010/api/v1/companies/3/users" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "管理员",
    "password": "admin123",
    "role": "admin"
  }'
```

---

### 4. 更新企业用户信息

**接口地址**: `PUT /api/v1/companies/{companyId}/users/{userId}`

**权限要求**: 
- 企业Owner可以修改所有用户
- 企业Admin可以修改Member用户
- Member只能修改自己的基本信息（不能修改角色、状态等）

**请求参数**:
- companyId (path): 企业ID
- userId (path): 用户ID

**请求体**:
```json
{
  "name": "更新后的姓名",
  "phone": "13900139001",
  "avatar": "https://example.com/new-avatar.jpg",
  "position": "高级产品经理",
  "department": "产品部",
  "joinedAt": "2025-01-20",
  "role": "admin",
  "isActive": true,
  "emailVerified": true
}
```

**字段说明**:
- 所有字段都是可选的
- Member用户不能修改role、isActive、emailVerified字段
- Admin不能将用户提升为Owner

**响应示例**:
```json
{
  "id": "7",
  "createdAt": "2025-07-26T20:00:00.000+08:00",
  "updatedAt": "2025-07-26T20:05:00.000+08:00",
  "deletedAt": null,
  "email": "newuser@example.com",
  "name": "更新后的姓名",
  "phone": "13900139001",
  "avatar": "https://example.com/new-avatar.jpg",
  "position": "高级产品经理",
  "department": "产品部",
  "joinedAt": "2025-01-20",
  "emailVerified": true,
  "role": "admin",
  "isActive": true,
  "lastLoginAt": null,
  "companyId": "3"
}
```

**测试用例**:
```bash
# 更新用户基本信息
curl -X PUT "http://localhost:3010/api/v1/companies/3/users/7" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "李小明",
    "phone": "13800138002",
    "position": "高级工程师",
    "department": "研发部"
  }'

# 提升用户为管理员（需要Owner权限）
curl -X PUT "http://localhost:3010/api/v1/companies/3/users/7" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

---

### 5. 删除企业用户

**接口地址**: `DELETE /api/v1/companies/{companyId}/users/{userId}`

**权限要求**: 
- 企业Owner可以删除所有用户（除了自己）
- 企业Admin可以删除Member用户
- 不能删除自己

**请求参数**:
- companyId (path): 企业ID
- userId (path): 用户ID

**响应示例**:
```json
{
  "message": "用户删除成功"
}
```

**测试用例**:
```bash
# 删除用户
curl -X DELETE "http://localhost:3010/api/v1/companies/3/users/7" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

### 6. 切换用户激活状态

**接口地址**: `PATCH /api/v1/companies/{companyId}/users/{userId}/toggle-status`

**权限要求**: 
- 企业Owner可以切换所有用户状态（除了自己）
- 企业Admin可以切换Member用户状态
- 不能修改自己的状态

**请求参数**:
- companyId (path): 企业ID
- userId (path): 用户ID

**响应示例**:
```json
{
  "id": "7",
  "createdAt": "2025-07-26T20:00:00.000+08:00",
  "updatedAt": "2025-07-26T20:10:00.000+08:00",
  "deletedAt": null,
  "email": "newuser@example.com",
  "name": "新用户",
  "phone": "13900139000",
  "avatar": null,
  "position": "产品经理",
  "department": "产品部",
  "joinedAt": "2025-01-15",
  "emailVerified": false,
  "role": "member",
  "isActive": false,
  "lastLoginAt": null,
  "companyId": "3"
}
```

**测试用例**:
```bash
# 切换用户状态
curl -X PATCH "http://localhost:3010/api/v1/companies/3/users/7/toggle-status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

## 管理员端用户查询接口

### 1. 获取所有用户列表（管理员）

**接口地址**: `GET /api/v1/admin/users`

**权限要求**: 管理员权限

**查询参数**:
```json
{
  "page": 1,
  "limit": 20,
  "search": "用户搜索关键词",
  "role": "owner|admin|member",
  "companyId": 3,
  "companyName": "企业名称",
  "companyType": "supplier|buyer",
  "country": "CN",
  "isActive": true,
  "emailVerified": true,
  "registeredStartDate": "2025-01-01",
  "registeredEndDate": "2025-12-31",
  "lastLoginStartDate": "2025-01-01",
  "lastLoginEndDate": "2025-12-31",
  "hasSubscription": true,
  "hasPaidSubscription": true,
  "sortBy": "createdAt|updatedAt|lastLoginAt|email",
  "sortOrder": "ASC|DESC"
}
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "6",
      "createdAt": "2025-07-13T22:24:27.591+08:00",
      "updatedAt": "2025-07-13T22:24:27.795+08:00",
      "deletedAt": null,
      "email": "supplier2.owner@huanong-bio.com",
      "name": "赵永强",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "position": "总经理",
      "department": "管理层",
      "joinedAt": "2025-01-01",
      "emailVerified": true,
      "role": "owner",
      "isActive": true,
      "lastLoginAt": null,
      "companyId": "3",
      "company": {
        "id": "3",
        "name": {
          "zh-CN": "华农生物科技集团",
          "en": "HuaNong Biotechnology Group"
        },
        "type": "supplier"
      },
      "subscriptions": []
    }
  ],
  "meta": {
    "totalItems": 50,
    "itemCount": 20,
    "itemsPerPage": 20,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

**测试用例**:
```bash
# 获取所有用户列表
curl -X GET "http://localhost:3010/api/v1/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"

# 按企业筛选用户
curl -X GET "http://localhost:3010/api/v1/admin/users?companyId=3" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"

# 搜索未验证邮箱的用户
curl -X GET "http://localhost:3010/api/v1/admin/users?emailVerified=false" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"

# 按注册时间筛选
curl -X GET "http://localhost:3010/api/v1/admin/users?registeredStartDate=2025-01-01&registeredEndDate=2025-01-31" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

---

### 2. 获取用户详情（管理员）

**接口地址**: `GET /api/v1/admin/users/{userId}`

**权限要求**: 管理员权限

**请求参数**:
- userId (path): 用户ID

**响应示例**:
```json
{
  "id": "6",
  "createdAt": "2025-07-13T22:24:27.591+08:00",
  "updatedAt": "2025-07-13T22:24:27.795+08:00",
  "deletedAt": null,
  "email": "supplier2.owner@huanong-bio.com",
  "password": "$2b$10$aRSoUSymsy9UzTNZvIr2KuKzhZtyhia2rVRq3TzpVHyQYKGiwbI0q",
  "name": "赵永强",
  "phone": "13800138000",
  "avatar": "https://example.com/avatar.jpg",
  "position": "总经理",
  "department": "管理层",
  "joinedAt": "2025-01-01",
  "emailVerified": true,
  "role": "owner",
  "isActive": true,
  "lastLoginAt": null,
  "companyId": "3",
  "company": {
    "id": "3",
    "name": {
      "zh-CN": "华农生物科技集团",
      "en": "HuaNong Biotechnology Group"
    },
    "type": "supplier"
  },
  "orders": [],
  "inquiries": []
}
```

**测试用例**:
```bash
# 获取用户详情
curl -X GET "http://localhost:3010/api/v1/admin/users/6" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误/邮箱已存在/不能操作自己 |
| 401 | 未认证或Token无效 |
| 403 | 权限不足 |
| 404 | 用户或企业不存在 |
| 500 | 服务器内部错误 |

## 权限说明

### 管理员权限
- 可以查看所有企业的所有用户信息
- 可以通过各种条件筛选和搜索用户
- 主要用于平台监控和数据分析

## 注意事项

1. 所有密码字段在返回时都会被过滤（企业端接口不返回密码）
2. 软删除：删除用户时使用软删除，数据不会真正删除
3. 邮箱唯一性：同一邮箱不能注册多个账户
4. 权限校验：所有操作都会进行严格的权限校验
5. 数据验证：所有输入数据都会进行格式和长度验证