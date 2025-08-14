# 供应商功能 API 文档

## 概述

本文档描述采购端供应商相关的所有API接口，包括搜索、详情查看、收藏管理和产品查看功能。

## 接口列表

### 1. 供应商搜索

**接口地址**: `GET /api/v1/companies/suppliers`

**功能描述**: 根据条件搜索活跃的供应商，支持关键词、地区、企业规模筛选和多种排序方式

**请求参数**:
```typescript
interface SearchSuppliersParams {
  search?: string;           // 关键词搜索（公司名称、描述）
  country?: string;          // 国家/地区代码
  companySize?: 'small' | 'medium' | 'large';  // 企业规模
  isTop100?: boolean;        // 是否只显示Top100供应商
  sortBy?: 'createdAt' | 'productCount' | 'name';  // 排序字段
  sortOrder?: 'ASC' | 'DESC';  // 排序方向
  page?: number;             // 页码，默认1
  limit?: number;            // 每页数量，默认20
}
```

**请求示例**:
```bash
GET /api/v1/companies/suppliers?search=农业&country=CN&companySize=medium&isTop100=true&sortBy=productCount&sortOrder=DESC&page=1&limit=10
```

**响应格式**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": [
    {
      "id": 26,
      "name": {
        "zh-CN": "阳光农业科技有限公司",
        "en": "Sunshine Agricultural Technology Co., Ltd.",
        "es": "Sunshine Tecnología Agrícola S.L."
      },
      "type": "supplier",
      "status": "active",
      "country": "CN",
      "companySize": "medium",
      "isTop100": true,
      "rating": 4.8,
      "createdAt": "2024-01-15T08:30:00.000Z",
      "profile": {
        "description": "专业的农业科技供应商",
        "address": "中国北京市朝阳区",
        "phone": "+86 010-12345678",
        "website": "https://sunshine-agri.com"
      }
    }
  ],
  "meta": {
    "totalItems": 15,
    "itemCount": 10,
    "currentPage": 1,
    "totalPages": 2,
    "itemsPerPage": 10
  }
}
```

### 2. 供应商详情

**接口地址**: `GET /api/v1/companies/suppliers/:id`

**功能描述**: 获取指定供应商的详细信息，包括基本信息和产品列表

**请求参数**:
- `id` (path): 供应商ID

**请求示例**:
```bash
GET /api/v1/companies/suppliers/26
```

**响应格式**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "id": 26,
    "name": {
      "zh-CN": "阳光农业科技有限公司",
      "en": "Sunshine Agricultural Technology Co., Ltd.",
      "es": "Sunshine Tecnología Agrícola S.L."
    },
    "type": "supplier",
    "status": "active",
    "country": "CN",
    "companySize": "medium",
    "isTop100": true,
    "rating": 4.8,
    "businessCategories": ["农业", "科技"],
    "businessScope": "农业技术研发与产品销售",
    "mainProducts": ["有机肥料", "农业设备", "种子"],
    "annualImportExportValue": "1000万美元",
    "profile": {
      "description": "专业的农业科技供应商，致力于为全球客户提供优质的农业产品和技术服务",
      "address": "中国北京市朝阳区科技园区",
      "phone": "+86 010-12345678",
      "website": "https://sunshine-agri.com"
    },
    "products": [
      {
        "id": 5,
        "name": {
          "zh-CN": "有机肥料",
          "en": "Organic Fertilizer"
        },
        "status": "active",
        "price": {
          "amount": 150.00,
          "currency": "USD"
        }
      }
    ],
    "createdAt": "2024-01-15T08:30:00.000Z",
    "updatedAt": "2024-03-20T10:15:00.000Z"
  }
}
```

### 3. 收藏供应商

**接口地址**: `POST /api/v1/companies/suppliers/favorites`

**功能描述**: 将指定供应商添加到用户的收藏列表

**请求体**:
```json
{
  "supplierId": 26,
  "note": "优质的农业供应商，产品质量很好"
}
```

**响应格式**:
```json
{
  "success": true,
  "message": "收藏成功",
  "data": {
    "id": 1,
    "userId": 16,
    "supplierId": 26,
    "note": "优质的农业供应商，产品质量很好",
    "createdAt": "2024-03-20T14:30:00.000Z",
    "updatedAt": "2024-03-20T14:30:00.000Z"
  }
}
```

### 4. 获取收藏列表

**接口地址**: `GET /api/v1/companies/suppliers/favorites/list`

**功能描述**: 获取当前用户收藏的供应商列表

**请求参数**:
```typescript
interface GetFavoritesParams {
  search?: string;  // 搜索收藏的供应商名称
  page?: number;    // 页码，默认1
  limit?: number;   // 每页数量，默认20
}
```

**请求示例**:
```bash
GET /api/v1/companies/suppliers/favorites/list?search=农业&page=1&limit=10
```

**响应格式**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "userId": 16,
      "supplierId": 26,
      "note": "优质的农业供应商，产品质量很好",
      "createdAt": "2024-03-20T14:30:00.000Z",
      "supplier": {
        "id": 26,
        "name": {
          "zh-CN": "阳光农业科技有限公司",
          "en": "Sunshine Agricultural Technology Co., Ltd."
        },
        "country": "CN",
        "companySize": "medium",
        "isTop100": true,
        "rating": 4.8
      }
    }
  ],
  "meta": {
    "totalItems": 5,
    "itemCount": 1,
    "currentPage": 1,
    "totalPages": 1,
    "itemsPerPage": 10
  }
}
```

### 5. 检查收藏状态

**接口地址**: `GET /api/v1/companies/suppliers/favorites/:supplierId/status`

**功能描述**: 检查当前用户是否已收藏指定供应商

**请求参数**:
- `supplierId` (path): 供应商ID

**请求示例**:
```bash
GET /api/v1/companies/suppliers/favorites/26/status
```

**响应格式**:
```json
{
  "success": true,
  "message": "检查成功",
  "data": {
    "isFavorited": true
  }
}
```

### 6. 更新收藏备注

**接口地址**: `PUT /api/v1/companies/suppliers/favorites/:supplierId`

**功能描述**: 更新收藏供应商的备注信息

**请求参数**:
- `supplierId` (path): 供应商ID

**请求体**:
```json
{
  "note": "更新后的备注信息"
}
```

**响应格式**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": 1,
    "userId": 16,
    "supplierId": 26,
    "note": "更新后的备注信息",
    "createdAt": "2024-03-20T14:30:00.000Z",
    "updatedAt": "2024-03-20T15:45:00.000Z"
  }
}
```

### 7. 取消收藏

**接口地址**: `DELETE /api/v1/companies/suppliers/favorites/:supplierId`

**功能描述**: 取消收藏指定供应商

**请求参数**:
- `supplierId` (path): 供应商ID

**请求示例**:
```bash
DELETE /api/v1/companies/suppliers/favorites/26
```

**响应格式**:
```json
{
  "success": true,
  "message": "取消收藏成功"
}
```

### 8. 供应商产品列表

**接口地址**: `GET /api/v1/products`

**功能描述**: 获取指定供应商的产品列表

**请求参数**:
```typescript
interface GetProductsParams {
  supplierId: number;  // 必填：供应商ID
  search?: string;     // 产品名称搜索
  category?: string;   // 产品分类
  page?: number;       // 页码，默认1
  limit?: number;      // 每页数量，默认20
}
```

**请求示例**:
```bash
GET /api/v1/products?supplierId=26&search=肥料&page=1&limit=10
```

**响应格式**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": [
    {
      "id": 5,
      "name": {
        "zh-CN": "有机肥料",
        "en": "Organic Fertilizer",
        "es": "Fertilizante Orgánico"
      },
      "description": {
        "zh-CN": "天然有机肥料，适用于各种作物",
        "en": "Natural organic fertilizer suitable for various crops"
      },
      "category": "农业用品",
      "status": "active",
      "price": {
        "amount": 150.00,
        "currency": "USD"
      },
      "unit": "吨",
      "minOrderQuantity": 1,
      "images": [
        "https://example.com/fertilizer1.jpg"
      ],
      "supplierId": 26,
      "createdAt": "2024-02-10T09:00:00.000Z"
    }
  ],
  "meta": {
    "totalItems": 25,
    "itemCount": 10,
    "currentPage": 1,
    "totalPages": 3,
    "itemsPerPage": 10
  }
}
```

### 9. 供应商轻量级查找

**接口地址**: `GET /api/v1/companies/suppliers/lookup`

**功能描述**: 轻量级供应商查找接口，仅返回ID和名称，用于下拉选择等场景

**请求参数**:
```typescript
interface SuppliersLookupParams {
  search?: string;  // 搜索关键词
  page?: number;    // 页码，默认1
  limit?: number;   // 每页数量，默认10
}
```

**请求示例**:
```bash
GET /api/v1/companies/suppliers/lookup?search=农&page=1&limit=5
```

**响应格式**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": [
    {
      "id": 26,
      "name": {
        "zh-CN": "阳光农业科技有限公司",
        "en": "Sunshine Agricultural Technology Co., Ltd.",
        "es": "Sunshine Tecnología Agrícola S.L."
      }
    }
  ],
  "meta": {
    "totalItems": 8,
    "itemCount": 1,
    "currentPage": 1,
    "totalPages": 1,
    "itemsPerPage": 5,
    "hasNextPage": false,
    "hasPrevious": false
  }
}
```

## 错误响应

所有接口在出现错误时都会返回统一的错误格式：

```json
{
  "success": false,
  "message": "具体的错误信息",
  "statusCode": 400
}
```

### 常见错误码

- `400`: 请求参数错误
- `401`: 未授权，token无效或过期
- `403`: 权限不足
- `404`: 资源不存在（供应商不存在、收藏记录不存在等）
- `409`: 冲突（重复收藏等）
- `500`: 服务器内部错误

## 认证要求

所有接口都需要在请求头中携带有效的JWT token：

```
Authorization: Bearer <your_jwt_token>
```

## 使用场景

### 1. 供应商列表页面
```javascript
// 获取供应商列表（带筛选和排序）
GET /api/v1/companies/suppliers?search=农业&country=CN&sortBy=productCount&sortOrder=DESC&page=1&limit=20

// 检查收藏状态（批量）
GET /api/v1/companies/suppliers/favorites/{supplierId}/status (对每个供应商)
```

### 2. 供应商详情页面
```javascript
// 获取供应商详情
GET /api/v1/companies/suppliers/26

// 检查收藏状态
GET /api/v1/companies/suppliers/favorites/26/status

// 获取供应商产品
GET /api/v1/products?supplierId=26&page=1&limit=10
```

### 3. 收藏管理页面
```javascript
// 获取收藏列表
GET /api/v1/companies/suppliers/favorites?page=1&limit=20

// 更新备注
PUT /api/v1/companies/suppliers/favorites/26
```

### 4. 下拉选择场景
```javascript
// 轻量级查找供应商
GET /api/v1/companies/suppliers/lookup?search=农&limit=10
```

## 性能优化建议

1. **分页加载**: 大量数据使用分页，避免一次加载过多数据
2. **搜索防抖**: 前端搜索输入时添加防抖，避免频繁请求
3. **状态缓存**: 收藏状态可以在前端缓存，减少重复请求
4. **图片懒加载**: 供应商和产品图片使用懒加载
5. **数据预取**: 在列表页面可以预取详情页面可能需要的数据

## 测试说明

使用提供的测试脚本进行功能验证：

```bash
chmod +x test/business/test-supplier-functionality.sh
./test/business/test-supplier-functionality.sh
```

测试脚本会验证所有接口的正常功能和错误处理场景。