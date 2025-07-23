# 产品管理接口文档

## 概述
本文档描述了产品管理模块的所有API接口，包括产品的CRUD操作、审核流程、上下架管理以及防治方法管理。

## 接口列表

### 1. 产品管理

#### 1.1 获取产品列表
- **URL**: `/api/v1/admin/products`
- **方法**: `GET`
- **权限**: 需要管理员权限
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页条数（默认20，最大100）
  - `status`: 产品状态（DRAFT, PENDING_REVIEW, ACTIVE, REJECTED）
  - `search`: 搜索关键词（产品名称、农药名称、登记证号）
  - `supplierId`: 供应商ID
  - `supplierName`: 供应商名称
  - `formulation`: 剂型（字典值）
  - `toxicity`: 毒性等级（LOW, MEDIUM, HIGH, ACUTE）
  - `activeIngredient`: 有效成分名称
  - `registrationNumber`: 登记证号
  - `registrationHolder`: 登记证持有人
  - `productCategory`: 产品品类
  - `country`: 国家代码
  - `exportRestrictedCountries`: 出口限制国家（数组）
  - `minOrderQuantityMin`: 最低起订量（最小）
  - `minOrderQuantityMax`: 最低起订量（最大）
  - `isListed`: 是否上架
  - `effectiveDateStart`: 有效截止日期（开始）
  - `effectiveDateEnd`: 有效截止日期（结束）
  - `firstApprovalDateStart`: 首次批准日期（开始）
  - `firstApprovalDateEnd`: 首次批准日期（结束）
  - `createdStartDate`: 创建开始日期
  - `createdEndDate`: 创建结束日期
  - `updatedStartDate`: 更新开始日期
  - `updatedEndDate`: 更新结束日期
  - `hasControlMethods`: 是否有防治方法
  - `sortBy`: 排序字段（createdAt, updatedAt, name, pesticideName, effectiveDate, firstApprovalDate, minOrderQuantity）
  - `sortOrder`: 排序方向（ASC, DESC）

- **响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "name": {
        "zh-CN": "草甘膦原药",
        "en": "Glyphosate Technical"
      },
      "pesticideName": {
        "zh-CN": "草甘膦",
        "en": "Glyphosate"
      },
      "supplierId": 1,
      "formulation": "TC",
      "toxicity": "LOW",
      "registrationNumber": "PD20201234",
      "registrationHolder": "某某农药有限公司",
      "effectiveDate": "2025-12-31",
      "firstApprovalDate": "2020-06-15",
      "totalContent": "95%",
      "activeIngredient1": {
        "name": {
          "zh-CN": "草甘膦",
          "en": "Glyphosate"
        },
        "content": "95%"
      },
      "minOrderQuantity": 1000,
      "minOrderUnit": "kg",
      "details": {
        "productCategory": "herbicide",
        "exportRestrictedCountries": ["US", "CA"],
        "description": "高纯度草甘膦原药",
        "remarks": "需要特殊储存条件"
      },
      "isListed": true,
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ],
  "meta": {
    "totalItems": 100,
    "itemCount": 20,
    "itemsPerPage": 20,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

#### 1.2 获取待审核产品列表
- **URL**: `/api/v1/admin/products/pending`
- **方法**: `GET`
- **权限**: 需要管理员权限
- **查询参数**: 同获取产品列表，但自动筛选status=PENDING_REVIEW

#### 1.3 获取产品详情
- **URL**: `/api/v1/admin/products/:id`
- **方法**: `GET`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 产品ID

- **响应示例**:
```json
{
  "id": 1,
  "name": {
    "zh-CN": "草甘膦原药",
    "en": "Glyphosate Technical"
  },
  "pesticideName": {
    "zh-CN": "草甘膦",
    "en": "Glyphosate"
  },
  "supplier": {
    "id": 1,
    "name": "某某农药有限公司",
    "country": "CN"
  },
  "controlMethods": [
    {
      "id": 1,
      "targetCrop": {
        "zh-CN": "小麦",
        "en": "Wheat"
      },
      "pestDisease": {
        "zh-CN": "杂草",
        "en": "Weeds"
      },
      "applicationMethod": {
        "zh-CN": "喷雾",
        "en": "Spray"
      },
      "dosage": {
        "zh-CN": "每亩20-30毫升",
        "en": "20-30ml per acre"
      },
      "sortOrder": 0,
      "isActive": true
    }
  ],
  // ... 其他字段同列表响应
}
```

#### 1.4 创建产品
- **URL**: `/api/v1/admin/products`
- **方法**: `POST`
- **权限**: 需要管理员权限
- **请求体**:
```json
{
  "name": {
    "zh-CN": "草甘膦原药",
    "en": "Glyphosate Technical"
  },
  "pesticideName": {
    "zh-CN": "草甘膦",
    "en": "Glyphosate"
  },
  "supplierId": 1,
  "formulation": "TC",
  "toxicity": "LOW",
  "registrationNumber": "PD20201234",
  "registrationHolder": "某某农药有限公司",
  "effectiveDate": "2025-12-31",
  "firstApprovalDate": "2020-06-15",
  "totalContent": "95%",
  "activeIngredient1": {
    "name": {
      "zh-CN": "草甘膦",
      "en": "Glyphosate"
    },
    "content": "95%"
  },
  "minOrderQuantity": 1000,
  "minOrderUnit": "kg",
  "details": {
    "productCategory": "herbicide",
    "exportRestrictedCountries": ["US", "CA"],
    "description": "高纯度草甘膦原药",
    "remarks": "需要特殊储存条件"
  },
  "status": "DRAFT",
  "isListed": false
}
```

#### 1.5 更新产品
- **URL**: `/api/v1/admin/products/:id`
- **方法**: `PUT`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 产品ID
- **请求体**: 同创建产品，所有字段可选

#### 1.6 删除产品
- **URL**: `/api/v1/admin/products/:id`
- **方法**: `DELETE`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 产品ID

#### 1.7 审核产品
- **URL**: `/api/v1/admin/products/:id/review`
- **方法**: `POST`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 产品ID
- **请求体**:
```json
{
  "approved": true,  // true=通过, false=拒绝
  "reason": "审核拒绝原因（拒绝时必填）"
}
```

#### 1.8 产品上架
- **URL**: `/api/v1/admin/products/:id/list`
- **方法**: `PATCH`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 产品ID

#### 1.9 产品下架
- **URL**: `/api/v1/admin/products/:id/unlist`
- **方法**: `PATCH`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 产品ID

### 2. 防治方法管理

#### 2.1 获取产品的防治方法列表
- **URL**: `/api/v1/admin/products/:productId/control-methods`
- **方法**: `GET`
- **权限**: 需要管理员权限
- **路径参数**:
  - `productId`: 产品ID

- **响应示例**:
```json
[
  {
    "id": 1,
    "productId": 1,
    "targetCrop": {
      "zh-CN": "小麦",
      "en": "Wheat"
    },
    "pestDisease": {
      "zh-CN": "蚜虫",
      "en": "Aphids"
    },
    "applicationMethod": {
      "zh-CN": "叶面喷雾",
      "en": "Foliar spray"
    },
    "dosage": {
      "zh-CN": "每亩20-30毫升",
      "en": "20-30ml per acre"
    },
    "sortOrder": 0,
    "isActive": true,
    "remarks": "施药时注意风向",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

#### 2.2 创建防治方法
- **URL**: `/api/v1/admin/products/:productId/control-methods`
- **方法**: `POST`
- **权限**: 需要管理员权限
- **路径参数**:
  - `productId`: 产品ID
- **请求体**:
```json
{
  "targetCrop": {
    "zh-CN": "小麦",
    "en": "Wheat"
  },
  "pestDisease": {
    "zh-CN": "蚜虫",
    "en": "Aphids"
  },
  "applicationMethod": {
    "zh-CN": "叶面喷雾",
    "en": "Foliar spray"
  },
  "dosage": {
    "zh-CN": "每亩20-30毫升",
    "en": "20-30ml per acre"
  },
  "sortOrder": 0,
  "isActive": true,
  "remarks": "施药时注意风向"
}
```

#### 2.3 批量创建防治方法
- **URL**: `/api/v1/admin/products/:productId/control-methods/batch`
- **方法**: `POST`
- **权限**: 需要管理员权限
- **路径参数**:
  - `productId`: 产品ID
- **请求体**:
```json
{
  "controlMethods": [
    {
      "targetCrop": {
        "zh-CN": "小麦",
        "en": "Wheat"
      },
      "pestDisease": {
        "zh-CN": "蚜虫",
        "en": "Aphids"
      },
      "applicationMethod": {
        "zh-CN": "叶面喷雾",
        "en": "Foliar spray"
      },
      "dosage": {
        "zh-CN": "每亩20-30毫升",
        "en": "20-30ml per acre"
      }
    },
    {
      "targetCrop": {
        "zh-CN": "水稻",
        "en": "Rice"
      },
      "pestDisease": {
        "zh-CN": "稻飞虱",
        "en": "Rice planthopper"
      },
      "applicationMethod": {
        "zh-CN": "喷雾",
        "en": "Spray"
      },
      "dosage": {
        "zh-CN": "每亩15-20毫升",
        "en": "15-20ml per acre"
      }
    }
  ]
}
```

#### 2.4 更新防治方法
- **URL**: `/api/v1/admin/control-methods/:id`
- **方法**: `PUT`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 防治方法ID
- **请求体**: 同创建防治方法，所有字段可选

#### 2.5 删除防治方法
- **URL**: `/api/v1/admin/control-methods/:id`
- **方法**: `DELETE`
- **权限**: 需要管理员权限
- **路径参数**:
  - `id`: 防治方法ID

#### 2.6 更新防治方法排序
- **URL**: `/api/v1/admin/products/:productId/control-methods/order`
- **方法**: `PUT`
- **权限**: 需要管理员权限
- **路径参数**:
  - `productId`: 产品ID
- **请求体**:
```json
{
  "1": 0,  // 防治方法ID: 新的排序位置
  "2": 1,
  "3": 2
}
```

## 错误响应

所有接口的错误响应格式统一如下：

```json
{
  "statusCode": 400,
  "message": "错误信息描述",
  "error": "Bad Request"
}
```

常见错误码：
- `400`: 参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 注意事项

1. **多语言字段**: 产品名称、农药名称、有效成分名称、防治方法相关字段都支持多语言，至少需要提供中文（zh-CN）
2. **字典值**: 剂型（formulation）和毒性（toxicity）字段使用字典值，需要从字典接口获取有效值
3. **产品状态流转**: 
   - DRAFT（草稿）→ PENDING_REVIEW（待审核）→ ACTIVE（已通过）/REJECTED（已拒绝）
   - 只有ACTIVE状态的产品才能上架
4. **防治方法**: 一个产品可以有多个防治方法，支持排序和启用/禁用控制
5. **权限控制**: 所有接口都需要管理员权限（admin或super_admin角色）