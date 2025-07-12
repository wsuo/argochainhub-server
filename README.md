# 智慧农化采购平台 (Argochainhub)

一个专业的B2B农化产品采购平台后端系统，基于NestJS开发。

## 功能特性

### 核心业务功能
- 🏢 **多租户企业管理** - 支持买家和供应商两种企业类型
- 👥 **用户权限管理** - 企业所有者、管理员、员工等角色
- 📦 **产品管理** - 农化产品发布、审核、管理
- 💰 **询价业务流程** - 完整的询价、报价、确认流程
- 💳 **订阅与配额** - 会员套餐、配额管理、续费
- 📁 **文件管理** - 产品图片、企业证书、文档上传
- 🔔 **通知系统** - 业务事件通知、系统消息

### 技术架构
- 🛡️ **多层Guard系统** - JWT认证、角色权限、企业类型、配额控制
- 🗄️ **数据库设计** - 15张表的完整业务模型
- 📊 **管理后台** - 企业审核、产品审核、数据统计
- 🔄 **状态机** - 询价流程、审核流程状态管理
- 📝 **API文档** - 完整的Swagger文档
- 🌍 **多语言支持** - 中文、英语、西班牙语三语种支持

## 技术栈

- **框架**: NestJS 10.x
- **数据库**: MySQL 8.x
- **ORM**: TypeORM
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **验证**: class-validator
- **文件存储**: 火山引擎TOS对象存储
- **文件上传**: Multer
- **事件系统**: EventEmitter2

## 快速开始

### 环境要求
- Node.js >= 18.x
- MySQL >= 8.x
- npm >= 9.x

### 安装依赖
```bash
npm install
```

### 环境配置
复制环境配置文件：
```bash
cp .env.example .env.local
```

配置数据库连接和其他环境变量：
```env
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=argochainhub

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 火山引擎TOS对象存储配置
VOLC_ACCESS_KEY_ID=your_access_key_id
VOLC_ACCESS_KEY_SECRET=your_access_key_secret
TOS_REGION=cn-beijing
TOS_ENDPOINT=https://tos-s3-cn-beijing.volces.com
TOS_BUCKET=your_bucket_name
TOS_REQUEST_TIMEOUT=60000

# 应用配置
APP_PORT=3000
NODE_ENV=development
```

### 数据库初始化
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE argochainhub;

# 启动应用服务器（会自动创建表结构）
npm run start:dev

# 初始化系统数据（管理员账户、测试企业、套餐等）
npm run seed
```

### 启动开发服务器
```bash
npm run start:dev
```

应用将在 http://localhost:3000 启动

API文档地址: http://localhost:3000/api/docs

## API文档

项目集成了Swagger文档，在开发环境下访问 `/api/docs` 查看完整的API文档。

### 主要API端点

#### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/change-password` - 修改密码

#### 企业管理
- `GET /api/v1/companies/profile` - 获取企业信息
- `PUT /api/v1/companies/profile` - 更新企业信息
- `GET /api/v1/companies/suppliers` - 搜索供应商

#### 产品管理
- `GET /api/v1/products/my-products` - 获取我的产品
- `POST /api/v1/products` - 发布产品（支持多语言字段）
- `PUT /api/v1/products/:id` - 更新产品（支持多语言字段）
- `DELETE /api/v1/products/:id` - 删除产品
- `GET /api/v1/products/search` - 产品搜索（支持多语言搜索）

#### 询价管理
- `POST /api/v1/inquiries` - 创建询价单
- `GET /api/v1/inquiries` - 获取询价单列表
- `PATCH /api/v1/inquiries/:id/quote` - 供应商报价
- `PATCH /api/v1/inquiries/:id/confirm` - 买家确认

#### 文件管理
- `POST /api/v1/uploads` - 上传文件
- `GET /api/v1/uploads/my-files` - 获取我的文件
- `GET /api/v1/uploads/:id/url` - 获取文件访问URL
- `GET /api/v1/uploads/:id/download` - 下载文件
- `GET /api/v1/uploads/:id/preview` - 预览文件（图片）

#### 通知系统
- `GET /api/v1/notifications` - 获取通知列表
- `PATCH /api/v1/notifications/:id/read` - 标记已读
- `GET /api/v1/notifications/unread-count` - 未读数量

## 多语言支持

### 支持的语言
- 🇨🇳 **中文 (zh-CN)** - 默认语言
- 🇺🇸 **英语 (en)** - 国际市场
- 🇪🇸 **西班牙语 (es)** - 拉美市场

### 多语言字段
以下实体的字段支持多语言JSON格式：

#### Product（产品）
- `name` - 产品名称
- `category` - 产品分类
- `activeIngredient` - 有效成分
- `description` - 产品描述

#### Company（企业）
- `name` - 企业名称
- `profile.description` - 企业简介

#### Plan（套餐）
- `name` - 套餐名称

### 多语言数据格式
```json
{
  "zh-CN": "中文内容",
  "en": "English Content", 
  "es": "Contenido en español"
}
```

### API使用示例

#### 创建多语言产品
```bash
POST /api/v1/products
{
  "name": {
    "zh-CN": "草甘膦原药",
    "en": "Glyphosate Technical",
    "es": "Glifosato Técnico"
  },
  "category": {
    "zh-CN": "除草剂",
    "en": "Herbicide", 
    "es": "Herbicida"
  },
  "description": {
    "zh-CN": "高效除草剂，广谱杀草效果好",
    "en": "High-efficiency herbicide with broad-spectrum weed control",
    "es": "Herbicida de alta eficiencia con control de malezas de amplio espectro"
  }
}
```

#### 多语言搜索
```bash
GET /api/v1/products/search?search=herbicide&language=en
GET /api/v1/products/search?search=除草剂&language=zh-CN
GET /api/v1/products/search?search=herbicida&language=es
```

## 数据库结构

### 核心实体
- **companies** - 企业信息
- **users** - 用户信息
- **products** - 产品信息
- **inquiries** - 询价单
- **inquiry_items** - 询价项目
- **subscriptions** - 订阅记录
- **orders** - 订单记录
- **notifications** - 通知记录
- **attachments** - 附件记录

## 系统角色与测试账户

系统初始化后包含以下预设账户，可用于测试各种功能：

### 🔧 系统管理员账户
| 角色 | 用户名 | 密码 | 权限说明 | 登录接口 |
|------|--------|------|----------|----------|
| 超级管理员 | `superadmin` | `Admin123!` | 系统最高权限 | `POST /api/v1/auth/admin/login` |
| 普通管理员 | `admin` | `Admin123!` | 企业审核、产品审核等 | `POST /api/v1/auth/admin/login` |

### 🏢 企业买家账户（阳光农业采购有限公司）
| 角色 | 邮箱 | 密码 | 权限说明 | 登录接口 |
|------|------|------|----------|----------|
| 企业所有者 | `buyer.owner@yangguang-agri.com` | `User123!` | 企业最高权限 | `POST /api/v1/auth/login` |
| 企业管理员 | `buyer.admin@yangguang-agri.com` | `User123!` | 企业管理权限 | `POST /api/v1/auth/login` |
| 企业成员 | `buyer.member@yangguang-agri.com` | `User123!` | 基础业务权限 | `POST /api/v1/auth/login` |

### 🏭 企业供应商账户

**绿田化工科技有限公司**：
| 角色 | 邮箱 | 密码 | 权限说明 | 登录接口 |
|------|------|------|----------|----------|
| 企业所有者 | `supplier.owner@lutian-chem.com` | `User123!` | 企业最高权限 | `POST /api/v1/auth/login` |
| 企业管理员 | `supplier.admin@lutian-chem.com` | `User123!` | 企业管理权限 | `POST /api/v1/auth/login` |

**华农生物科技集团**：
| 角色 | 邮箱 | 密码 | 权限说明 | 登录接口 |
|------|------|------|----------|----------|
| 企业所有者 | `supplier2.owner@huanong-bio.com` | `User123!` | 企业最高权限 | `POST /api/v1/auth/login` |

### 💰 预设订阅套餐
| 套餐名称 | 价格 | 用户数 | 产品限制 | 询价限制/月 | 支持级别 |
|----------|------|--------|----------|-------------|----------|
| 基础版 | ¥99/月 | 3个用户 | 10个产品 | 20次询价 | 基础支持 |
| 专业版 | ¥299/月 | 10个用户 | 50个产品 | 100次询价 | 专业支持 |
| 企业版 | ¥999/月 | 50个用户 | 200个产品 | 500次询价 | 企业支持 |

### 数据管理命令
```bash
# 初始化系统数据
npm run seed

# 清空并重新初始化数据
npm run seed:clear && npm run seed
```

## 部署说明

### 生产环境构建
```bash
npm run build
```

### 启动生产服务
```bash
npm run start:prod
```

### Docker部署
```bash
# 构建镜像
docker build -t argochainhub-server .

# 启动容器
docker run -p 3000:3000 argochainhub-server
```

## 开发指南

### 代码规范
- 使用TypeScript严格模式
- 遵循NestJS最佳实践
- 使用class-validator进行数据验证
- 实体使用TypeORM装饰器

### 测试
```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### 代码检查
```bash
# ESLint检查
npm run lint

# TypeScript编译检查
npm run build
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License