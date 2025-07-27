# VIP配置管理接口测试文档

## 概述
VIP配置管理接口用于管理平台的VIP会员配置，包括不同平台（供应商/采购商）、不同等级（促销版/基础版/高级版）的VIP配置信息。

## 接口列表

### 1. 创建VIP配置
- **接口地址**: `POST /api/v1/admin/vip-configs`
- **权限要求**: `VIP_CONFIG_CREATE`
- **请求示例**:
```json
{
  "name": {
    "zh-CN": "供应商基础版",
    "en": "Supplier Basic Edition",
    "es": "Edición Básica del Proveedor"
  },
  "platform": "supplier",
  "level": "basic",
  "currency": "USD",
  "originalPrice": 299,
  "currentPrice": 199,
  "days": 365,
  "accountQuota": 5,
  "maxPurchaseCount": 3,
  "bonusDays": 0,
  "sampleViewCount": 50,
  "vipLevelNumber": 2,
  "inquiryManagementCount": 30,
  "registrationManagementCount": 10,
  "productPublishCount": 50,
  "viewCount": 100,
  "remarkZh": "适合中小型供应商的基础方案",
  "remarkEn": "Basic plan suitable for small and medium suppliers",
  "remarkEs": "Plan básico adecuado para proveedores pequeños y medianos",
  "isActive": true,
  "sortOrder": 2
}
```

### 2. 查询VIP配置列表
- **接口地址**: `GET /api/v1/admin/vip-configs`
- **权限要求**: `VIP_CONFIG_VIEW`
- **查询参数**:
  - `platform`: 平台类型 (supplier/purchaser)
  - `level`: VIP等级 (promotion/basic/advanced)
  - `currency`: 币种 (USD/CNY)
  - `isActive`: 是否启用
  - `keyword`: 关键字搜索
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20，最大100）

- **响应示例**:
```json
{
  "data": [
    {
      "id": 1,
      "name": {
        "zh-CN": "供应商基础版",
        "en": "Supplier Basic Edition",
        "es": "Edición Básica del Proveedor"
      },
      "platform": "supplier",
      "level": "basic",
      "currency": "USD",
      "originalPrice": "299.00",
      "currentPrice": "199.00",
      "discount": "67折",
      "days": 365,
      "accountQuota": 5,
      "maxPurchaseCount": 3,
      "bonusDays": 0,
      "sampleViewCount": 50,
      "vipLevelNumber": 2,
      "inquiryManagementCount": 30,
      "registrationManagementCount": 10,
      "productPublishCount": 50,
      "viewCount": 100,
      "remarkZh": "适合中小型供应商的基础方案",
      "remarkEn": "Basic plan suitable for small and medium suppliers",
      "remarkEs": "Plan básico adecuado para proveedores pequeños y medianos",
      "isActive": true,
      "sortOrder": 2,
      "createdAt": "2025-01-28T00:00:00.000Z",
      "updatedAt": "2025-01-28T00:00:00.000Z"
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

### 3. 获取VIP配置详情
- **接口地址**: `GET /api/v1/admin/vip-configs/:id`
- **权限要求**: `VIP_CONFIG_VIEW`
- **响应**: 返回单个VIP配置详情

### 4. 更新VIP配置
- **接口地址**: `PATCH /api/v1/admin/vip-configs/:id`
- **权限要求**: `VIP_CONFIG_UPDATE`
- **请求示例**:
```json
{
  "currentPrice": 169,
  "remarkZh": "限时优惠价格"
}
```

### 5. 删除VIP配置
- **接口地址**: `DELETE /api/v1/admin/vip-configs/:id`
- **权限要求**: `VIP_CONFIG_DELETE`
- **说明**: 软删除，不会真正删除数据

### 6. 切换VIP配置状态
- **接口地址**: `POST /api/v1/admin/vip-configs/:id/toggle-status`
- **权限要求**: `VIP_CONFIG_UPDATE`
- **说明**: 切换isActive状态

### 7. 批量切换状态
- **接口地址**: `POST /api/v1/admin/vip-configs/batch-toggle-status`
- **权限要求**: `VIP_CONFIG_UPDATE`
- **请求示例**:
```json
{
  "ids": [1, 2, 3],
  "isActive": false
}
```

### 8. 更新排序
- **接口地址**: `PATCH /api/v1/admin/vip-configs/:id/sort-order`
- **权限要求**: `VIP_CONFIG_UPDATE`
- **请求示例**:
```json
{
  "sortOrder": 1
}
```

### 9. 根据平台获取VIP配置
- **接口地址**: `GET /api/v1/admin/vip-configs/platform/:platform`
- **权限要求**: `VIP_CONFIG_VIEW`
- **说明**: 获取指定平台的所有启用的VIP配置

### 10. 获取统计信息
- **接口地址**: `GET /api/v1/admin/vip-configs/statistics`
- **权限要求**: `VIP_CONFIG_VIEW`
- **响应示例**:
```json
{
  "totalConfigs": 6,
  "activeConfigs": 5,
  "inactiveConfigs": 1,
  "platformStats": [
    { "platform": "supplier", "count": 3 },
    { "platform": "purchaser", "count": 3 }
  ],
  "levelStats": [
    { "level": "promotion", "count": 2 },
    { "level": "basic", "count": 2 },
    { "level": "advanced", "count": 2 }
  ],
  "currencyStats": [
    { "currency": "USD", "count": 3 },
    { "currency": "CNY", "count": 3 }
  ]
}
```

## 字段说明

### 平台类型 (platform)
- `supplier`: 供应端
- `purchaser`: 采购端

### VIP等级 (level)
- `promotion`: 促销版
- `basic`: 基础版
- `advanced`: 高级版

### 币种 (currency)
- `USD`: 美元
- `CNY`: 人民币

### 权限配置
不同平台的配置项含义：
- **viewCount**: 
  - 供应端：查看采购商次数
  - 采购端：查看供应商次数
- **productPublishCount**: 仅供应端使用，产品发布数量限制
- **sampleViewCount**: 采购商查看供应商样品管理的次数

## 测试数据

### 供应商配置示例
```json
[
  {
    "name": { "zh-CN": "供应商促销版", "en": "Supplier Promotion", "es": "Promoción del Proveedor" },
    "platform": "supplier",
    "level": "promotion",
    "currency": "USD",
    "originalPrice": 99,
    "currentPrice": 49,
    "days": 30,
    "accountQuota": 1,
    "maxPurchaseCount": 1,
    "bonusDays": 0,
    "sampleViewCount": 10,
    "vipLevelNumber": 1,
    "inquiryManagementCount": 5,
    "registrationManagementCount": 2,
    "productPublishCount": 10,
    "viewCount": 20,
    "sortOrder": 1
  },
  {
    "name": { "zh-CN": "供应商基础版", "en": "Supplier Basic", "es": "Básico del Proveedor" },
    "platform": "supplier",
    "level": "basic",
    "currency": "USD",
    "originalPrice": 299,
    "currentPrice": 199,
    "days": 365,
    "accountQuota": 5,
    "maxPurchaseCount": 3,
    "bonusDays": 0,
    "sampleViewCount": 50,
    "vipLevelNumber": 2,
    "inquiryManagementCount": 30,
    "registrationManagementCount": 10,
    "productPublishCount": 50,
    "viewCount": 100,
    "sortOrder": 2
  },
  {
    "name": { "zh-CN": "供应商高级版", "en": "Supplier Advanced", "es": "Avanzado del Proveedor" },
    "platform": "supplier",
    "level": "advanced",
    "currency": "USD",
    "originalPrice": 999,
    "currentPrice": 699,
    "days": 365,
    "accountQuota": 20,
    "maxPurchaseCount": 5,
    "bonusDays": 60,
    "sampleViewCount": 200,
    "vipLevelNumber": 3,
    "inquiryManagementCount": 100,
    "registrationManagementCount": 50,
    "productPublishCount": 200,
    "viewCount": 500,
    "sortOrder": 3
  }
]
```

### 采购商配置示例
```json
[
  {
    "name": { "zh-CN": "采购商促销版", "en": "Purchaser Promotion", "es": "Promoción del Comprador" },
    "platform": "purchaser",
    "level": "promotion",
    "currency": "CNY",
    "originalPrice": 699,
    "currentPrice": 349,
    "days": 30,
    "accountQuota": 1,
    "maxPurchaseCount": 1,
    "bonusDays": 0,
    "sampleViewCount": 20,
    "vipLevelNumber": 1,
    "inquiryManagementCount": 10,
    "registrationManagementCount": 5,
    "productPublishCount": 0,
    "viewCount": 50,
    "sortOrder": 1
  },
  {
    "name": { "zh-CN": "采购商基础版", "en": "Purchaser Basic", "es": "Básico del Comprador" },
    "platform": "purchaser",
    "level": "basic",
    "currency": "CNY",
    "originalPrice": 1999,
    "currentPrice": 1299,
    "days": 365,
    "accountQuota": 3,
    "maxPurchaseCount": 3,
    "bonusDays": 0,
    "sampleViewCount": 100,
    "vipLevelNumber": 2,
    "inquiryManagementCount": 50,
    "registrationManagementCount": 20,
    "productPublishCount": 0,
    "viewCount": 200,
    "sortOrder": 2
  },
  {
    "name": { "zh-CN": "采购商高级版", "en": "Purchaser Advanced", "es": "Avanzado del Comprador" },
    "platform": "purchaser",
    "level": "advanced",
    "currency": "CNY",
    "originalPrice": 6999,
    "currentPrice": 4999,
    "days": 365,
    "accountQuota": 10,
    "maxPurchaseCount": 5,
    "bonusDays": 90,
    "sampleViewCount": 500,
    "vipLevelNumber": 3,
    "inquiryManagementCount": 200,
    "registrationManagementCount": 100,
    "productPublishCount": 0,
    "viewCount": 1000,
    "sortOrder": 3
  }
]
```

## 注意事项

1. **权限控制**: 所有接口都需要管理员权限，不同操作需要不同的权限
2. **数据验证**: 
   - 同一平台、等级和币种的组合必须唯一
   - 价格必须大于0
   - 折扣会根据原价和现价自动计算
3. **软删除**: 删除操作不会真正删除数据，只是标记为已删除
4. **排序**: 配置列表按sortOrder升序，createdAt降序排列

## 更新记录

- 2025-01-28: 创建VIP配置管理模块
  - 实现基础CRUD功能
  - 添加批量操作功能
  - 实现统计接口
  - 支持多语言配置名称