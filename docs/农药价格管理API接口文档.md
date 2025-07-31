# 农药价格管理模块 API 接口文档

## 概述

农药价格管理模块提供了完整的标准农药信息管理和价格走势数据管理功能，同时支持通过图片智能解析价格数据的功能。

## 认证

所有接口都需要管理员认证，请在请求头中添加：
```
Authorization: Bearer your_admin_jwt_token
```

**获取管理员Token:**
```bash
POST /api/v1/auth/admin/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "Admin123!"
}
```

**临时测试Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc1MzUwODQ2MiwiZXhwIjoxNzU0MTEzMjYyfQ.H1hL94u3QFSTeV5ko2ixbcUF9OxC8TngQTIAze_60IA
```

## 标准农药管理接口

### 1. 创建标准农药

**POST** `/api/v1/admin/pesticides`

**权限要求:** super_admin, admin

**请求体:**
```json
{
  "category": "insecticide",
  "formulation": "TC",
  "productName": {
    "zh-CN": "高效氯氟氰菊酯",
    "en": "Lambda-Cyhalothrin",
    "es": "Lambda-Cialotrina"
  },
  "concentration": "96% TC",
  "isVisible": true
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "农药创建成功",
  "data": {
    "id": 1,
    "category": "insecticide",
    "formulation": "TC",
    "productName": {
      "zh-CN": "高效氯氟氰菊酯",
      "en": "Lambda-Cyhalothrin",
      "es": "Lambda-Cialotrina"
    },
    "concentration": "96% TC",
    "isVisible": true,
    "createdAt": "2025-07-31T10:00:00.000Z",
    "updatedAt": "2025-07-31T10:00:00.000Z"
  }
}
```

**测试命令:**
```bash
curl -X POST http://localhost:3050/api/v1/admin/pesticides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "category": "insecticide",
    "formulation": "TC", 
    "productName": {
      "zh-CN": "测试农药",
      "en": "Test Pesticide",
      "es": "Pesticida de Prueba"
    },
    "concentration": "95% TC",
    "isVisible": true
  }'
```

### 2. 分页查询标准农药

**GET** `/api/v1/admin/pesticides`

**权限要求:** super_admin, admin, operator

**查询参数:**
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：20，最大：100）
- `category`: 产品类别筛选
- `formulation`: 剂型筛选
- `isVisible`: 是否只显示可见的农药
- `search`: 产品名称搜索（支持中英西三语）

**测试命令:**
```bash
# 基本查询
curl -X GET "http://localhost:3050/api/v1/admin/pesticides?page=1&limit=10" \
  -H "Authorization: Bearer your_token"

# 按类别查询
curl -X GET "http://localhost:3050/api/v1/admin/pesticides?category=insecticide" \
  -H "Authorization: Bearer your_token"

# 搜索查询
curl -X GET "http://localhost:3050/api/v1/admin/pesticides?search=氯氟氰菊酯" \
  -H "Authorization: Bearer your_token"
```

### 3. 查询单个标准农药

**GET** `/api/v1/admin/pesticides/:id`

**权限要求:** super_admin, admin, operator

**测试命令:**
```bash
curl -X GET http://localhost:3050/api/v1/admin/pesticides/1 \
  -H "Authorization: Bearer your_token"
```

### 4. 更新标准农药

**PATCH** `/api/v1/admin/pesticides/:id`

**权限要求:** super_admin, admin

**测试命令:**
```bash
curl -X PATCH http://localhost:3050/api/v1/admin/pesticides/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "concentration": "98% TC",
    "isVisible": false
  }'
```

### 5. 删除标准农药

**DELETE** `/api/v1/admin/pesticides/:id`

**权限要求:** super_admin, admin

**测试命令:**
```bash
curl -X DELETE http://localhost:3050/api/v1/admin/pesticides/1 \
  -H "Authorization: Bearer your_token"
```

## 价格走势管理接口

### 1. 创建价格走势记录

**POST** `/api/v1/admin/price-trends`

**权限要求:** super_admin, admin

**请求体:**
```json
{
  "weekEndDate": "2025-07-25",
  "unitPrice": 125000.50,
  "exchangeRate": 7.2095,
  "pesticideId": 1
}
```

**测试命令:**
```bash
curl -X POST http://localhost:3050/api/v1/admin/price-trends \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "weekEndDate": "2025-07-31",
    "unitPrice": 128000.00,
    "exchangeRate": 7.21,
    "pesticideId": 1
  }'
```

### 2. 分页查询价格走势

**GET** `/api/v1/admin/price-trends`

**权限要求:** super_admin, admin, operator

**查询参数:**
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：20）
- `pesticideId`: 农药ID筛选
- `startDate`: 开始日期
- `endDate`: 结束日期
- `sortBy`: 排序字段（weekEndDate, unitPrice, exchangeRate, createdAt）
- `sortOrder`: 排序方向（ASC, DESC）

**测试命令:**
```bash
# 基本查询
curl -X GET "http://localhost:3050/api/v1/admin/price-trends?page=1&limit=10" \
  -H "Authorization: Bearer your_token"

# 按农药ID查询
curl -X GET "http://localhost:3050/api/v1/admin/price-trends?pesticideId=1" \
  -H "Authorization: Bearer your_token"

# 按日期范围查询
curl -X GET "http://localhost:3050/api/v1/admin/price-trends?startDate=2025-01-01&endDate=2025-07-31" \
  -H "Authorization: Bearer your_token"
```

### 3. 获取价格走势图表数据

**GET** `/api/v1/admin/price-trends/chart/:pesticideId`

**权限要求:** super_admin, admin, operator

**查询参数:**
- `startDate`: 开始日期（可选）
- `endDate`: 结束日期（可选）

**测试命令:**
```bash
# 获取农药ID为1的价格走势图表数据
curl -X GET "http://localhost:3050/api/v1/admin/price-trends/chart/1" \
  -H "Authorization: Bearer your_token"

# 指定日期范围
curl -X GET "http://localhost:3050/api/v1/admin/price-trends/chart/1?startDate=2025-01-01&endDate=2025-07-31" \
  -H "Authorization: Bearer your_token"
```

### 4. 查询单个价格记录

**GET** `/api/v1/admin/price-trends/:id`

**权限要求:** super_admin, admin, operator

**测试命令:**
```bash
curl -X GET http://localhost:3050/api/v1/admin/price-trends/1 \
  -H "Authorization: Bearer your_token"
```

### 5. 更新价格记录

**PATCH** `/api/v1/admin/price-trends/:id`

**权限要求:** super_admin, admin

**测试命令:**
```bash
curl -X PATCH http://localhost:3050/api/v1/admin/price-trends/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "unitPrice": 130000.00,
    "exchangeRate": 7.22
  }'
```

### 6. 删除价格记录

**DELETE** `/api/v1/admin/price-trends/:id`

**权限要求:** super_admin, admin

**测试命令:**
```bash
curl -X DELETE http://localhost:3050/api/v1/admin/price-trends/1 \
  -H "Authorization: Bearer your_token"
```

## 图片价格解析接口

### 1. 上传图片并解析价格数据

**POST** `/api/v1/admin/image-parse/price-data`

**权限要求:** super_admin, admin

**请求格式:** multipart/form-data

**参数:**
- `images`: 图片文件（最多10张，支持jpg、jpeg、png、gif、webp格式，单文件最大10MB）
- `exchangeRate`: 当前汇率（数字）

**图片格式要求:**
- **支持格式**: PNG, JPEG, JPG, GIF, WebP
- **文件大小限制**: 最大10MB
- **文件验证**: 自动验证文件头签名，确保文件完整性
- **Base64编码**: 使用优化的编码算法，确保图片正确转换
- **错误处理**: 详细的错误信息，包括格式验证、大小检查等

**图片质量要求:**
- 图片清晰，文字可读
- 表格结构完整
- 推荐分辨率：至少1024x768
- 避免模糊、歪斜的图片

**测试命令:**
```bash
# 使用单张图片测试
curl -X POST http://localhost:3050/api/v1/admin/image-parse/price-data \
  -H "Authorization: Bearer your_token" \
  -F "images=@/path/to/price_image.jpg" \
  -F "exchangeRate=7.21"

# 使用多张图片测试
curl -X POST http://localhost:3050/api/v1/admin/image-parse/price-data \
  -H "Authorization: Bearer your_token" \
  -F "images=@/path/to/price_image1.jpg" \
  -F "images=@/path/to/price_image2.jpg" \
  -F "exchangeRate=7.21"
```

**响应示例:**
```json
{
  "success": true,
  "message": "图片解析完成，成功处理 5 条价格数据",
  "data": {
    "totalImages": 2,
    "totalParsedData": 8,
    "successfulSaves": 5,
    "failedSaves": 3,
    "parsedData": [
      {
        "productName": "高效氯氟氰菊酯",
        "weekEndDate": "2025-07-25",
        "unitPrice": 125000.50
      }
    ],
    "errors": [
      "未找到匹配的农药产品: 未知农药名称"
    ]
  }
}
```

**错误响应示例:**
```json
{
  "success": false,
  "message": "图片文件格式验证失败，文件可能已损坏",
  "statusCode": 400,
  "timestamp": "2025-07-31T10:00:00.000Z",
  "path": "/api/v1/admin/image-parse/price-data"
}
```

**常见错误类型:**
- `图片文件为空或损坏` - 文件上传失败或文件损坏
- `图片文件过大` - 超过10MB限制
- `不支持的图片格式` - 非图片文件或不支持的格式
- `PNG/JPEG/GIF/WebP文件格式验证失败` - 文件头签名验证失败
- `图片base64转换失败` - 编码过程中出现错误
- `网络连接失败` - 无法访问AI图片解析服务
- `AI图片解析服务错误` - OpenRouter API调用失败
- `AI服务响应格式错误` - API返回数据格式不正确

## 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "statusCode": 400,
  "timestamp": "2025-07-31T10:00:00.000Z",
  "path": "/api/v1/admin/pesticides"
}
```

## 常见错误码

- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 数据冲突（如重复创建）
- `500`: 服务器内部错误

## 功能特性

### 1. 多语言支持
所有农药产品名称支持中文、英文、西班牙文三种语言，搜索时也支持三种语言的关键词匹配。

### 2. 汇率自动计算
价格走势数据同时支持人民币和美元显示，通过汇率字段自动计算美元价格。

### 3. 图片智能解析
支持上传价格数据表格图片，使用AI大模型自动提取产品名称、日期和价格信息，并自动匹配数据库中的农药产品。

### 4. 数据完整性
- 价格记录与农药产品通过外键关联
- 同一农药同一日期只能有一条价格记录
- 支持软删除，确保数据安全

### 5. 图表数据支持
提供专门的图表数据接口，返回格式化的价格走势数据，方便前端绘制价格趋势图。

## 数据导入状态

当前数据库已预装数据：
- **标准农药**: 94个产品，完整的中英西三语名称
- **价格数据**: 3000+条记录，覆盖2024-2025年数据
- **覆盖率**: 42.6%的农药产品有价格历史数据

## 注意事项

1. **图片解析功能依赖:**
   - 依赖OpenRouter AI服务，需要网络连接
   - 需要配置OPENROUTER_API_KEY环境变量
   
2. **图片格式和质量:**
   - 支持格式：PNG, JPEG, JPG, GIF, WebP
   - 单张图片最大10MB，最多同时上传10张图片
   - 自动验证文件头签名，确保文件完整性
   - 建议使用高质量、清晰的图片以提高解析准确率
   
3. **数据完整性:**
   - 价格数据的周结束日期和农药ID组合必须唯一
   - 删除操作为软删除，数据不会真正删除
   - 图片解析结果会自动匹配数据库中的农药产品
   
4. **错误处理:**
   - 提供详细的中文错误信息，便于问题排查
   - 区分不同类型的错误（文件格式、网络、API等）
   - 支持批量处理时的部分成功机制

## 开发进度

✅ **已完成功能:**
- 标准农药CRUD接口
- 价格走势CRUD接口  
- 图片解析价格数据接口
- OpenRouter AI集成
- 多语言搜索支持
- 汇率计算功能
- 数据验证和错误处理
- **图片base64编码优化** (2025-07-31)
  - 完善了图片文件验证机制
  - 添加了文件头签名验证
  - 优化了base64编码处理
  - 增强了错误处理和日志记录
  - 支持多种图片格式的魔数验证

## 后续开发建议

1. 增加批量导入农药数据功能
2. 添加价格预测算法
3. 支持更多图片格式和表格布局
4. 增加数据统计和分析接口
5. 添加价格变动提醒功能
6. 优化AI解析准确率