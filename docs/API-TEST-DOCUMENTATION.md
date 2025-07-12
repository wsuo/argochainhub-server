# 智慧农化采购平台后端API接口测试文档

## 认证说明

### 管理员登录
**POST** `/api/auth/admin/login`

请求体：
```json
{
  "username": "admin",
  "password": "password123"
}
```

响应：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin",
    "role": "super_admin"
  }
}
```

### 认证Header
所有后台管理接口都需要在请求头中添加：
```
Authorization: Bearer {access_token}
```

---

## 仪表盘接口

### 1. 获取KPI统计数据
**GET** `/api/admin/stats`

响应示例：
```json
{
  "totalCompanies": 125,
  "pendingCompanies": 8,
  "totalUsers": 342,
  "totalProducts": 1567,
  "pendingProducts": 23,
  "totalInquiries": 890,
  "totalOrders": 156,
  "companyTypeStats": [
    { "type": "supplier", "count": 78 },
    { "type": "buyer", "count": 47 }
  ],
  "inquiryStatusStats": [
    { "status": "pending_quote", "count": 156 },
    { "status": "quoted", "count": 89 },
    { "status": "confirmed", "count": 234 }
  ]
}
```

### 2. 获取仪表盘图表数据
**GET** `/api/admin/dashboard/charts`

响应示例：
```json
{
  "userGrowth": [
    {
      "date": "2024-01-01",
      "newUsers": 12,
      "totalUsers": 324
    }
  ],
  "companyRegistration": [
    {
      "date": "2024-01-01", 
      "newCompanies": 3,
      "totalCompanies": 125
    }
  ],
  "revenue": [
    {
      "date": "2024-01-01",
      "revenue": 12500.00,
      "orderCount": 8
    }
  ],
  "inquiryTrend": [
    {
      "date": "2024-01-01",
      "inquiryCount": 23,
      "matchedCount": 8
    }
  ],
  "productCategoryStats": [
    {
      "category": "杀虫剂",
      "count": 456,
      "percentage": 29.12
    }
  ]
}
```

---

## 企业管理接口

### 1. 获取待审核企业列表
**GET** `/api/admin/companies/pending?page=1&limit=20`

响应示例：
```json
{
  "data": [
    {
      "id": 1,
      "name": {
        "zh": "示例农化公司",
        "en": "Example Agro Company"
      },
      "type": "supplier",
      "status": "pending_review",
      "profile": {
        "description": {
          "zh": "专业农药供应商",
          "en": "Professional pesticide supplier"
        },
        "address": "北京市朝阳区",
        "phone": "400-123-4567"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "users": []
    }
  ],
  "meta": {
    "totalItems": 8,
    "itemCount": 8,
    "itemsPerPage": 20,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### 2. 审核企业
**POST** `/api/admin/companies/1/review`

请求体：
```json
{
  "approved": true,
  "reason": "企业资质齐全，符合平台要求"
}
```

响应：
```json
{
  "id": 1,
  "name": {
    "zh": "示例农化公司",
    "en": "Example Agro Company"
  },
  "status": "active"
}
```

### 3. 获取所有企业列表（支持筛选）
**GET** `/api/admin/companies?page=1&limit=20&status=active&type=supplier&search=农化`

查询参数：
- `page`: 页码
- `limit`: 每页条数
- `status`: 企业状态 (pending_review, active, disabled)
- `type`: 企业类型 (buyer, supplier)
- `search`: 搜索关键词

### 4. 获取企业详情
**GET** `/api/admin/companies/1`

响应示例：
```json
{
  "id": 1,
  "name": {
    "zh": "示例农化公司",
    "en": "Example Agro Company"
  },
  "type": "supplier",
  "status": "active",
  "profile": {
    "description": {
      "zh": "专业农药供应商",
      "en": "Professional pesticide supplier"
    },
    "address": "北京市朝阳区",
    "phone": "400-123-4567"
  },
  "rating": 4.5,
  "isTop100": false,
  "users": [
    {
      "id": 1,
      "username": "company_user",
      "email": "user@example.com"
    }
  ],
  "subscriptions": [
    {
      "id": 1,
      "type": "premium",
      "status": "active",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ]
}
```

### 5. 切换企业状态
**PATCH** `/api/admin/companies/1/toggle-status`

### 6. 创建新企业
**POST** `/api/admin/companies`

请求体：
```json
{
  "name": {
    "zh": "新农化公司",
    "en": "New Agro Company"
  },
  "type": "supplier",
  "status": "active",
  "profile": {
    "description": {
      "zh": "专业农药供应商",
      "en": "Professional pesticide supplier"
    },
    "address": "上海市浦东新区",
    "phone": "400-123-4567",
    "website": "https://example.com"
  },
  "rating": 4.0,
  "isTop100": false
}
```

### 7. 更新企业信息
**PUT** `/api/admin/companies/1`

请求体：
```json
{
  "name": {
    "zh": "更新的农化公司",
    "en": "Updated Agro Company"
  },
  "profile": {
    "description": {
      "zh": "更新的专业农药供应商",
      "en": "Updated professional pesticide supplier"
    },
    "address": "上海市浦东新区张江高科技园区",
    "phone": "400-123-4567"
  }
}
```

---

## 产品管理接口

### 1. 获取待审核产品列表
**GET** `/api/admin/products/pending?page=1&limit=20`

### 2. 审核产品
**POST** `/api/admin/products/1/review`

请求体：
```json
{
  "approved": true,
  "reason": "产品信息完整，符合平台要求"
}
```

### 3. 获取所有产品列表（支持筛选）
**GET** `/api/admin/products?page=1&limit=20&status=active&category=杀虫剂&search=草甘膦`

### 4. 获取产品详情
**GET** `/api/admin/products/1`

响应示例：
```json
{
  "id": 1,
  "name": {
    "zh": "草甘膦原药",
    "en": "Glyphosate Technical"
  },
  "category": {
    "zh": "除草剂",
    "en": "Herbicide"
  },
  "formulation": "原药",
  "activeIngredient": {
    "zh": "草甘膦",
    "en": "Glyphosate"
  },
  "content": "95%",
  "description": {
    "zh": "高效除草剂原药",
    "en": "High-efficiency herbicide technical"
  },
  "status": "active",
  "supplier": {
    "id": 1,
    "name": {
      "zh": "示例农化公司",
      "en": "Example Agro Company"
    }
  }
}
```

### 5. 切换产品状态
**PATCH** `/api/admin/products/1/toggle-status`

### 6. 创建新产品
**POST** `/api/admin/products`

请求体：
```json
{
  "name": {
    "zh": "新农药产品",
    "en": "New Pesticide Product"
  },
  "category": {
    "zh": "杀虫剂",
    "en": "Insecticide"
  },
  "casNo": "1071-83-6",
  "formulation": "乳油",
  "activeIngredient": {
    "zh": "氯氰菊酯",
    "en": "Cypermethrin"
  },
  "content": "10%",
  "description": {
    "zh": "高效杀虫剂",
    "en": "High-efficiency insecticide"
  },
  "details": {
    "toxicity": "低毒",
    "storageConditions": "阴凉干燥处存放",
    "shelfLife": "2年"
  },
  "supplierId": 1,
  "status": "active"
}
```

### 7. 更新产品信息
**PUT** `/api/admin/products/1`

请求体：
```json
{
  "name": {
    "zh": "更新的农药产品",
    "en": "Updated Pesticide Product"
  },
  "description": {
    "zh": "更新的高效杀虫剂",
    "en": "Updated high-efficiency insecticide"
  },
  "details": {
    "toxicity": "低毒",
    "storageConditions": "阴凉干燥处存放，避免阳光直射",
    "shelfLife": "3年"
  }
}
```

---

## 询价单业务流程管理接口

### 1. 获取询价单列表
**GET** `/api/admin/inquiries?page=1&limit=20&status=pending_quote&buyerId=1&supplierId=2`

查询参数：
- `page`: 页码 (可选)
- `limit`: 每页条数 (可选)
- `inquiryNo`: 询价单号 (可选)
- `status`: 询价单状态 (可选) - pending_quote/quoted/confirmed/declined/expired/cancelled
- `buyerId`: 买方企业ID (可选)
- `supplierId`: 供应商企业ID (可选)
- `createdStartDate`: 创建开始日期 (可选) - YYYY-MM-DD
- `createdEndDate`: 创建结束日期 (可选) - YYYY-MM-DD

响应示例：
```json
{
  "data": [
    {
      "id": 1,
      "inquiryNo": "INQ2024010001",
      "status": "pending_quote",
      "deadline": "2024-02-01",
      "details": {
        "deliveryLocation": "上海市",
        "tradeTerms": "FOB",
        "paymentMethod": "信用证",
        "buyerRemarks": "急需，请尽快报价"
      },
      "quoteDetails": null,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z",
      "buyer": {
        "id": 1,
        "name": {
          "zh": "农业技术有限公司",
          "en": "Agriculture Technology Co., Ltd."
        },
        "type": "buyer"
      },
      "supplier": {
        "id": 2,
        "name": {
          "zh": "化工制品有限公司",
          "en": "Chemical Products Co., Ltd."
        },
        "type": "supplier"
      },
      "items": [
        {
          "id": 1,
          "quantity": 100.000,
          "unit": "kg",
          "packagingReq": "25kg袋装",
          "productSnapshot": {
            "name": {
              "zh": "高效杀虫剂",
              "en": "High Efficiency Insecticide"
            },
            "category": {
              "zh": "杀虫剂",
              "en": "Insecticide"
            },
            "formulation": "乳油",
            "activeIngredient": {
              "zh": "毒死蜱",
              "en": "Chlorpyrifos"
            },
            "content": "40%"
          },
          "product": {
            "id": 1,
            "name": {
              "zh": "高效杀虫剂",
              "en": "High Efficiency Insecticide"
            }
          }
        }
      ]
    }
  ],
  "meta": {
    "totalItems": 50,
    "itemCount": 1,
    "itemsPerPage": 20,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

### 2. 获取询价单统计数据
**GET** `/api/admin/inquiries/stats`

响应示例：
```json
{
  "pendingQuote": 25,
  "quoted": 18,
  "confirmed": 12,
  "declined": 8,
  "expired": 5,
  "cancelled": 2,
  "total": 70
}
```

### 3. 获取询价单详情
**GET** `/api/admin/inquiries/1`

响应示例：
```json
{
  "id": 1,
  "inquiryNo": "INQ2024010001",
  "status": "quoted",
  "deadline": "2024-02-01",
  "details": {
    "deliveryLocation": "上海市",
    "tradeTerms": "FOB",
    "paymentMethod": "信用证",
    "buyerRemarks": "急需，请尽快报价"
  },
  "quoteDetails": {
    "totalPrice": 5000.00,
    "validUntil": "2024-02-01",
    "supplierRemarks": "产品质量保证，可提供样品"
  },
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-16T10:30:00.000Z",
  "buyer": {
    "id": 1,
    "name": {
      "zh": "农业技术有限公司",
      "en": "Agriculture Technology Co., Ltd."
    },
    "type": "buyer",
    "profile": {
      "description": {
        "zh": "专业农业技术服务公司",
        "en": "Professional agricultural technology service company"
      },
      "address": "上海市浦东新区",
      "phone": "+86-21-12345678"
    }
  },
  "supplier": {
    "id": 2,
    "name": {
      "zh": "化工制品有限公司",
      "en": "Chemical Products Co., Ltd."
    },
    "type": "supplier"
  },
  "items": [
    {
      "id": 1,
      "quantity": 100.000,
      "unit": "kg",
      "packagingReq": "25kg袋装",
      "productSnapshot": {
        "name": {
          "zh": "高效杀虫剂",
          "en": "High Efficiency Insecticide"
        },
        "category": {
          "zh": "杀虫剂",
          "en": "Insecticide"
        },
        "formulation": "乳油",
        "activeIngredient": {
          "zh": "毒死蜱",
          "en": "Chlorpyrifos"
        },
        "content": "40%"
      },
      "product": {
        "id": 1,
        "name": {
          "zh": "高效杀虫剂",
          "en": "High Efficiency Insecticide"
        },
        "category": {
          "zh": "杀虫剂",
          "en": "Insecticide"
        }
      }
    }
  ]
}
```

### 4. 更新询价单状态
**PATCH** `/api/admin/inquiries/1/status`

#### 报价操作
请求体：
```json
{
  "status": "quoted",
  "operatedBy": "admin_user",
  "quoteDetails": {
    "totalPrice": 5000.00,
    "validUntil": "2024-02-01",
    "supplierRemarks": "产品质量保证，可提供样品"
  }
}
```

#### 拒绝操作
请求体：
```json
{
  "status": "declined",
  "operatedBy": "admin_user",
  "declineReason": "价格超出预算范围"
}
```

#### 确认操作
请求体：
```json
{
  "status": "confirmed",
  "operatedBy": "admin_user"
}
```

#### 取消操作
请求体：
```json
{
  "status": "cancelled",
  "operatedBy": "admin_user"
}
```

响应示例：
```json
{
  "id": 1,
  "inquiryNo": "INQ2024010001",
  "status": "quoted",
  "deadline": "2024-02-01",
  "details": {
    "deliveryLocation": "上海市",
    "tradeTerms": "FOB",
    "paymentMethod": "信用证",
    "buyerRemarks": "急需，请尽快报价"
  },
  "quoteDetails": {
    "totalPrice": 5000.00,
    "validUntil": "2024-02-01",
    "supplierRemarks": "产品质量保证，可提供样品"
  },
  "updatedAt": "2024-01-16T10:30:00.000Z"
}
```

### 5. 删除询价单
**DELETE** `/api/admin/inquiries/1`

注意：只有状态为 `pending_quote` 或 `cancelled` 的询价单可以删除。

响应示例：
```json
{
  "message": "询价单删除成功"
}
```

---

## 样品申请业务流程管理接口

### 1. 获取样品申请列表
**GET** `/api/admin/sample-requests?page=1&limit=20&status=pending_approval&buyerId=1&supplierId=2`

查询参数：
- `page`: 页码 (可选)
- `limit`: 每页条数 (可选)
- `sampleReqNo`: 样品申请单号 (可选)
- `status`: 样品申请状态 (可选) - pending_approval/approved/shipped/delivered/rejected/cancelled
- `buyerId`: 买方企业ID (可选)
- `supplierId`: 供应商企业ID (可选)
- `productId`: 产品ID (可选)
- `createdStartDate`: 创建开始日期 (可选) - YYYY-MM-DD
- `createdEndDate`: 创建结束日期 (可选) - YYYY-MM-DD

响应示例：
```json
{
  "data": [
    {
      "id": 1,
      "sampleReqNo": "SAM2024010001",
      "quantity": 1.000,
      "unit": "kg",
      "status": "pending_approval",
      "details": {
        "purpose": "新产品测试使用",
        "shippingAddress": "上海市浦东新区张江高科技园区",
        "shippingMethod": "快递",
        "willingnessToPay": {
          "paid": true,
          "amount": 50.00
        }
      },
      "trackingInfo": null,
      "productSnapshot": {
        "name": "高效杀虫剂",
        "category": "杀虫剂",
        "formulation": "乳油",
        "activeIngredient": "毒死蜱",
        "content": "40%"
      },
      "deadline": "2024-02-01",
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z",
      "buyer": {
        "id": 1,
        "name": {
          "zh": "农业技术有限公司",
          "en": "Agriculture Technology Co., Ltd."
        },
        "type": "buyer"
      },
      "supplier": {
        "id": 2,
        "name": {
          "zh": "化工制品有限公司",
          "en": "Chemical Products Co., Ltd."
        },
        "type": "supplier"
      },
      "product": {
        "id": 1,
        "name": {
          "zh": "高效杀虫剂",
          "en": "High Efficiency Insecticide"
        },
        "category": {
          "zh": "杀虫剂",
          "en": "Insecticide"
        }
      }
    }
  ],
  "meta": {
    "totalItems": 30,
    "itemCount": 1,
    "itemsPerPage": 20,
    "totalPages": 2,
    "currentPage": 1
  }
}
```

### 2. 获取样品申请统计数据
**GET** `/api/admin/sample-requests/stats`

响应示例：
```json
{
  "pendingApproval": 15,
  "approved": 8,
  "shipped": 5,
  "delivered": 10,
  "rejected": 3,
  "cancelled": 2,
  "total": 43
}
```

### 3. 获取样品申请详情
**GET** `/api/admin/sample-requests/1`

响应示例：
```json
{
  "id": 1,
  "sampleReqNo": "SAM2024010001",
  "quantity": 1.000,
  "unit": "kg",
  "status": "shipped",
  "details": {
    "purpose": "新产品测试使用",
    "shippingAddress": "上海市浦东新区张江高科技园区科学大道100号",
    "shippingMethod": "快递",
    "willingnessToPay": {
      "paid": true,
      "amount": 50.00
    }
  },
  "trackingInfo": {
    "carrier": "SF Express",
    "trackingNumber": "SF1234567890"
  },
  "productSnapshot": {
    "name": "高效杀虫剂",
    "category": "杀虫剂",
    "formulation": "乳油",
    "activeIngredient": "毒死蜱",
    "content": "40%"
  },
  "deadline": "2024-02-01",
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2024-01-18T14:30:00.000Z",
  "buyer": {
    "id": 1,
    "name": {
      "zh": "农业技术有限公司",
      "en": "Agriculture Technology Co., Ltd."
    },
    "type": "buyer",
    "profile": {
      "description": {
        "zh": "专业农业技术服务公司",
        "en": "Professional agricultural technology service company"
      },
      "address": "上海市浦东新区",
      "phone": "+86-21-12345678"
    }
  },
  "supplier": {
    "id": 2,
    "name": {
      "zh": "化工制品有限公司",
      "en": "Chemical Products Co., Ltd."
    },
    "type": "supplier"
  },
  "product": {
    "id": 1,
    "name": {
      "zh": "高效杀虫剂",
      "en": "High Efficiency Insecticide"
    },
    "category": {
      "zh": "杀虫剂",
      "en": "Insecticide"
    },
    "formulation": "乳油",
    "content": "40%"
  }
}
```

### 4. 更新样品申请状态
**PATCH** `/api/admin/sample-requests/1/status`

#### 批准操作
请求体：
```json
{
  "status": "approved",
  "operatedBy": "admin_user"
}
```

#### 发货操作
请求体：
```json
{
  "status": "shipped",
  "operatedBy": "admin_user",
  "trackingInfo": {
    "carrier": "SF Express",
    "trackingNumber": "SF1234567890"
  }
}
```

#### 送达操作
请求体：
```json
{
  "status": "delivered",
  "operatedBy": "admin_user"
}
```

#### 拒绝操作
请求体：
```json
{
  "status": "rejected",
  "operatedBy": "admin_user",
  "rejectReason": "样品库存不足，暂时无法提供"
}
```

#### 取消操作
请求体：
```json
{
  "status": "cancelled",
  "operatedBy": "admin_user"
}
```

响应示例：
```json
{
  "id": 1,
  "sampleReqNo": "SAM2024010001",
  "status": "shipped",
  "trackingInfo": {
    "carrier": "SF Express",
    "trackingNumber": "SF1234567890"
  },
  "updatedAt": "2024-01-18T14:30:00.000Z"
}
```

### 5. 删除样品申请
**DELETE** `/api/admin/sample-requests/1`

注意：只有状态为 `pending_approval` 或 `cancelled` 的样品申请可以删除。

响应示例：
```json
{
  "message": "样品申请删除成功"
}
```

---

## 用户管理接口

### 1. 获取所有用户列表
**GET** `/api/admin/users?page=1&limit=20&search=张三`

### 2. 获取用户详情
**GET** `/api/admin/users/1`

---

## 翻译工具接口

### 1. 翻译文本
**POST** `/api/admin/utilities/translate`

请求体：
```json
{
  "sourceLanguage": "zh",
  "targetLanguage": "en", 
  "sourceText": "农药产品描述"
}
```

响应：
```json
{
  "data": {
    "translated_text": "Pesticide product description"
  }
}
```

### 2. 检测语言
**POST** `/api/admin/utilities/detect-language`

请求体：
```json
{
  "text": "这是一个中文文本"
}
```

响应：
```json
{
  "data": {
    "detected_language": "zh",
    "confidence": 0.99
  }
}
```

---

## 订阅管理接口

### 1. 查看企业订阅历史
**GET** `/api/admin/companies/1/subscriptions?page=1&limit=20`

### 2. 手动为企业添加订阅
**POST** `/api/admin/companies/1/subscriptions`

请求体：
```json
{
  "planId": 1,
  "startDate": "2024-01-01"
}
```

### 3. 取消订阅
**DELETE** `/api/admin/subscriptions/1`

---

## 订单管理接口

### 1. 获取所有订单列表
**GET** `/api/admin/orders?page=1&limit=20&status=completed&search=ORD001`

### 2. 获取订单详情
**GET** `/api/admin/orders/1`

---

## 会员计划管理接口

### 1. 获取所有会员计划
**GET** `/api/admin/plans?page=1&limit=20&includeInactive=false`

### 2. 创建会员计划
**POST** `/api/admin/plans`

请求体：
```json
{
  "name": {
    "zh": "高级会员",
    "en": "Premium Plan"
  },
  "price": 999.00,
  "durationDays": 365,
  "specs": {
    "userAccounts": 10,
    "aiQueriesMonthly": 1000,
    "inquiriesMonthly": 50,
    "sampleRequestsMonthly": 20,
    "productsLimit": 500,
    "supportLevel": "premium"
  },
  "isActive": true
}
```

### 3. 更新会员计划
**PUT** `/api/admin/plans/1`

### 4. 上架/下架会员计划
**PATCH** `/api/admin/plans/1/status`

---

## 错误码说明

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `429`: 请求频率限制
- `500`: 服务器内部错误

## 测试建议

1. **认证测试**: 先测试管理员登录获取token
2. **权限测试**: 使用无效token测试接口权限控制
3. **分页测试**: 测试各列表接口的分页功能
4. **筛选测试**: 测试各接口的查询参数筛选功能
5. **CRUD测试**: 按照创建→查询→更新→删除的顺序测试
6. **数据验证**: 测试各接口的参数验证逻辑
7. **错误处理**: 测试各种异常情况的错误响应

所有接口已经通过Swagger文档验证，可以通过 `/api/docs` 访问完整的API文档进行在线测试。

## 环境配置

### 开发环境

- **后端服务URL**: http://localhost:3010
- **API基础路径**: http://localhost:3010/api/v1
- **Swagger文档**: http://localhost:3010/api/docs
- **前端管理后台**: http://localhost:3020

### 端口配置

- **后端API服务**: 3010
- **前端管理后台**: 3020
- **数据库**: 3306
- **Redis**: 6379