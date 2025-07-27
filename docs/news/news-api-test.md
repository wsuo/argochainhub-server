# 新闻资讯管理接口测试文档

## 接口概述

新闻资讯管理模块包含管理端和用户端接口，支持新闻的创建、查询、更新、删除、发布等功能。

## 环境信息

- 服务地址：http://localhost:3010
- API前缀：/api/v1
- 数据库配置：
  - HOST: 100.72.60.117
  - PORT: 3306
  - DATABASE: argochainhub

## 管理员认证

获取Token：
```bash
POST /api/v1/auth/admin/login
{
  "username": "superadmin",
  "password": "Admin123!"
}
```

临时token: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc1MzUwODQ2MiwiZXhwIjoxNzU0MTEzMjYyfQ.H1hL94u3QFSTeV5ko2ixbcUF9OxC8TngQTIAze_60IA
```

## 管理端接口

### 1. 创建新闻资讯

**接口地址：** `POST /api/v1/admin/news`

**请求头：**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数：**
```json
{
  "title": {
    "zh-CN": "新闻标题（中文）",
    "en": "News Title (English)",
    "es": "Título de Noticias (Español)"
  },
  "content": {
    "zh-CN": "<p>新闻内容（支持HTML）</p>",
    "en": "<p>News content (HTML supported)</p>",
    "es": "<p>Contenido de noticias (HTML compatible)</p>"
  },
  "category": "NEWS_POLICY",  // 字典值
  "coverImage": "https://example.com/images/news.jpg",
  "sortOrder": 0,
  "isPublished": false
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": {...},
    "content": {...},
    "category": "NEWS_POLICY",
    "coverImage": "https://example.com/images/news.jpg",
    "sortOrder": 0,
    "isPublished": false,
    "publishedAt": null,
    "viewCount": 0,
    "createdAt": "2025-07-28T00:04:58.296+08:00",
    "updatedAt": "2025-07-28T00:04:58.296+08:00"
  },
  "message": "新闻资讯创建成功"
}
```

### 2. 查询新闻列表

**接口地址：** `GET /api/v1/admin/news`

**请求参数：**
- `category` (可选): 新闻类别
- `isPublished` (可选): 发布状态
- `keyword` (可选): 搜索关键词
- `page` (可选，默认1): 页码
- `pageSize` (可选，默认10): 每页数量

**响应示例：**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "title": {...},
        "content": {...},
        "category": "NEWS_POLICY",
        "isPublished": true,
        "publishedAt": "2025-07-28T00:04:58.000+08:00",
        "viewCount": 0
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  },
  "message": "查询成功"
}
```

### 3. 获取新闻详情

**接口地址：** `GET /api/v1/admin/news/{id}`

### 4. 更新新闻资讯

**接口地址：** `PATCH /api/v1/admin/news/{id}`

**请求参数：** 同创建接口，所有字段可选

### 5. 删除新闻资讯

**接口地址：** `DELETE /api/v1/admin/news/{id}`

**响应示例：**
```json
{
  "success": true,
  "message": "新闻资讯删除成功"
}
```

### 6. 发布新闻

**接口地址：** `POST /api/v1/admin/news/{id}/publish`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "2",
    "isPublished": true,
    "publishedAt": "2025-07-28T00:05:41.375+08:00"
  },
  "message": "新闻资讯发布成功"
}
```

### 7. 取消发布

**接口地址：** `POST /api/v1/admin/news/{id}/unpublish`

## 用户端接口

### 1. 获取已发布新闻列表

**接口地址：** `GET /api/v1/news`

**请求参数：**
- `category` (可选): 新闻类别
- `page` (可选，默认1): 页码
- `pageSize` (可选，默认10): 每页数量

**说明：** 只返回已发布的新闻

### 2. 获取新闻详情

**接口地址：** `GET /api/v1/news/{id}`

**说明：** 只能查看已发布的新闻

### 3. 增加浏览次数

**接口地址：** `POST /api/v1/news/{id}/view`

**响应示例：**
```json
{
  "success": true,
  "message": "浏览次数已更新"
}
```

## 新闻类别字典

系统预定义的新闻类别包括：

- `NEWS_POLICY`: 政策法规
- `NEWS_MARKET`: 市场动态
- `NEWS_TECHNOLOGY`: 技术创新
- `NEWS_INDUSTRY`: 行业资讯
- `NEWS_COMPANY`: 企业动态
- `NEWS_EXHIBITION`: 展会活动

## 权限说明

管理端接口需要对应的权限：

- `NEWS_VIEW`: 查看新闻资讯
- `NEWS_CREATE`: 创建新闻资讯
- `NEWS_UPDATE`: 更新新闻资讯
- `NEWS_DELETE`: 删除新闻资讯

超级管理员（super_admin）和管理员（admin）默认拥有除删除外的所有新闻管理权限。

## 测试示例

### 创建新闻
```bash
curl -X POST http://localhost:3010/api/v1/admin/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": {
      "zh-CN": "农药行业新政策发布",
      "en": "New Policies Released for Pesticide Industry",
      "es": "Nuevas Políticas Publicadas para la Industria de Pesticidas"
    },
    "content": {
      "zh-CN": "<p>农业部今日发布了新的农药管理条例。</p>",
      "en": "<p>The Ministry of Agriculture released new regulations.</p>",
      "es": "<p>El Ministerio publicó nuevas regulaciones.</p>"
    },
    "category": "NEWS_POLICY",
    "coverImage": "https://example.com/images/policy-news.jpg",
    "sortOrder": 1,
    "isPublished": true
  }'
```

### 查询新闻列表
```bash
curl -X GET "http://localhost:3010/api/v1/admin/news?page=1&pageSize=10" \
  -H "Authorization: Bearer {token}"
```

### 用户端查询
```bash
curl -X GET "http://localhost:3010/api/v1/news?page=1&pageSize=10"
```