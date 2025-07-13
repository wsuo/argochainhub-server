# 智慧农化采购平台 - 技术架构与API接口总览

## 🏗️ 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (待开发)                          │
├─────────────────────────────────────────────────────────────────┤
│                     API网关 / 负载均衡                          │
├─────────────────────────────────────────────────────────────────┤
│                     NestJS 应用服务层                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   后台管理模块   │  │   业务流程模块   │  │   用户权限模块   │  │
│  │   (29个接口)    │  │   (18个接口)    │  │   (8个接口)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   认证授权      │  │   数据验证      │  │   异常处理      │  │
│  │   Guards       │  │   DTOs/Pipes    │  │   Filters      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       数据持久层                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   MySQL 数据库   │  │   Redis 缓存    │  │   TypeORM ORM   │  │
│  │   (13个实体)    │  │   (会话存储)    │  │   (对象映射)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       外部服务层                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 火山引擎翻译API  │  │ 火山引擎TOS存储  │  │   第三方支付     │  │
│  │   (已集成)      │  │   (已配置)      │  │   (待集成)      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 数据模型架构

### 核心实体关系图

```
用户实体 (User)
├── 企业实体 (Company) [1:N]
│   ├── 产品实体 (Product) [1:N]
│   ├── 订阅实体 (Subscription) [1:N]
│   └── 订单实体 (Order) [1:N]
├── 询价单实体 (Inquiry) [1:N]
├── 样品申请实体 (SampleRequest) [1:N]
└── 登记申请实体 (RegistrationRequest) [1:N]

管理员实体 (AdminUser)
├── 角色实体 (Role) [N:M] - 待实现
├── 权限实体 (Permission) [N:M] - 待实现
└── 审计日志实体 (AuditLog) [1:N]

计划实体 (Plan)
├── 订阅实体 (Subscription) [1:N]
└── 订单实体 (Order) [1:N]
```

### 数据实体详情

| 实体名称 | 表名 | 主要字段 | 关联关系 |
|---------|------|---------|---------|
| User | users | id, username, email, name | Company(1:N) |
| Company | companies | id, name(多语言), type, status | User(N:1), Product(1:N) |
| Product | products | id, name(多语言), category(多语言), supplier | Company(N:1) |
| Inquiry | inquiries | id, inquiryNo, status, buyer, supplier | User(N:1), Company(N:1) |
| SampleRequest | sample_requests | id, sampleReqNo, status, trackingInfo | User(N:1), Product(N:1) |
| RegistrationRequest | registration_requests | id, regReqNo, status, targetCountry | User(N:1), Product(N:1) |
| AdminUser | admin_users | id, username, role, isActive | AuditLog(1:N) |
| Subscription | subscriptions | id, type, status, startDate, endDate | Company(N:1), Plan(N:1) |
| Order | orders | id, orderNo, amount, status | Company(N:1), User(N:1) |
| Plan | plans | id, name, price, durationDays, isActive | Subscription(1:N) |
| AuditLog | audit_logs | id, action, details, ipAddress | AdminUser(N:1) |

## 🔗 API接口总览

### 接口分类统计

| 模块分类 | 接口数量 | 完成状态 | 备注 |
|---------|---------|---------|------|
| 后台管理-基础功能 | 2 | ✅ 完成 | 仪表盘、统计 |
| 后台管理-企业管理 | 7 | ✅ 完成 | 含CRUD接口 |
| 后台管理-产品管理 | 7 | ✅ 完成 | 含CRUD接口 |
| 后台管理-用户管理 | 2 | ✅ 完成 | 查询功能 |
| 后台管理-订阅管理 | 3 | ✅ 完成 | 订阅操作 |
| 后台管理-订单管理 | 2 | ✅ 完成 | 查询功能 |
| 后台管理-会员计划 | 4 | ✅ 完成 | 计划CRUD |
| 后台管理-工具服务 | 2 | ✅ 完成 | 翻译服务 |
| 业务流程-询价单 | 6 | ✅ 完成 | 完整流程 |
| 业务流程-样品申请 | 6 | ✅ 完成 | 完整流程 |
| 业务流程-登记申请 | 6 | ✅ 完成 | 完整流程 |
| 管理员账户管理 | 8 | ✅ 完成 | 用户CRUD |
| 角色权限管理 | 0 | ❌ 待开发 | 预计4-6个接口 |
| 审计日志管理 | 0 | ❌ 待开发 | 预计3-4个接口 |
| **总计** | **55** | **94% 完成** | **2个模块待开发** |

### 详细接口列表

#### 1. 后台管理系统 API (29个接口)

**基础功能模块**
```http
GET    /admin/dashboard/charts        获取仪表盘图表数据
GET    /admin/stats                   获取管理统计数据
```

**企业管理模块**
```http
GET    /admin/companies/pending       获取待审核企业列表
POST   /admin/companies/:id/review    审核企业
GET    /admin/companies               获取所有企业列表
GET    /admin/companies/:id           获取企业详情
PATCH  /admin/companies/:id/toggle-status  切换企业状态
POST   /admin/companies               创建新企业 ⭐
PUT    /admin/companies/:id           更新企业信息 ⭐
```

**产品管理模块**
```http
GET    /admin/products/pending        获取待审核产品列表
POST   /admin/products/:id/review     审核产品
GET    /admin/products                获取所有产品列表
GET    /admin/products/:id            获取产品详情
PATCH  /admin/products/:id/toggle-status   切换产品状态
POST   /admin/products                创建新产品 ⭐
PUT    /admin/products/:id            更新产品信息 ⭐
```

**用户管理模块**
```http
GET    /admin/users                   获取所有用户列表
GET    /admin/users/:id               获取用户详情
```

**订阅管理模块**
```http
GET    /admin/companies/:id/subscriptions  查看企业订阅历史
POST   /admin/companies/:id/subscriptions  手动为企业添加订阅
DELETE /admin/subscriptions/:id            取消/终止订阅
```

**订单管理模块**
```http
GET    /admin/orders                  获取所有订单列表
GET    /admin/orders/:id              查看订单详情
```

**会员计划管理**
```http
GET    /admin/plans                   获取所有会员计划
POST   /admin/plans                   创建新会员计划
PUT    /admin/plans/:id               更新会员计划
PATCH  /admin/plans/:id/status        上架或下架会员计划
```

**工具服务**
```http
POST   /admin/utilities/translate     翻译文本
POST   /admin/utilities/detect-language  检测文本语言
```

#### 2. 业务流程管理 API (18个接口)

**询价单业务流程**
```http
GET    /admin/inquiries               获取询价单列表
GET    /admin/inquiries/stats         获取询价单统计数据
GET    /admin/inquiries/:id           获取询价单详情
PATCH  /admin/inquiries/:id/status    更新询价单状态
DELETE /admin/inquiries/:id           删除询价单
```

**样品申请业务流程**
```http
GET    /admin/sample-requests         获取样品申请列表
GET    /admin/sample-requests/stats   获取样品申请统计数据
GET    /admin/sample-requests/:id     获取样品申请详情
PATCH  /admin/sample-requests/:id/status  更新样品申请状态
DELETE /admin/sample-requests/:id     删除样品申请
```

**登记申请业务流程**
```http
GET    /admin/registration-requests   获取登记申请列表
GET    /admin/registration-requests/stats  获取登记申请统计数据
GET    /admin/registration-requests/:id    获取登记申请详情
PATCH  /admin/registration-requests/:id/status  更新登记申请状态
DELETE /admin/registration-requests/:id    删除登记申请
```

#### 3. 管理员账户管理 API (8个接口)

```http
GET    /admin/admin-users             获取管理员用户列表
GET    /admin/admin-users/stats       获取管理员用户统计数据
GET    /admin/admin-users/:id         获取管理员用户详情
POST   /admin/admin-users             创建管理员用户
PUT    /admin/admin-users/:id         更新管理员用户信息
PATCH  /admin/admin-users/:id/password       修改管理员用户密码
PATCH  /admin/admin-users/:id/reset-password 重置管理员用户密码
PATCH  /admin/admin-users/:id/toggle-status  切换管理员用户状态
DELETE /admin/admin-users/:id         删除管理员用户
```

#### 4. 待开发 API

**角色权限管理** (预计4-6个接口)
```http
GET    /admin/roles                   获取所有角色列表
POST   /admin/roles                   创建新角色
PUT    /admin/roles/:id               更新角色信息
DELETE /admin/roles/:id               删除角色
POST   /admin/roles/:id/permissions   为角色分配权限
GET    /admin/permissions             获取所有权限列表
```

**审计日志管理** (预计3-4个接口)
```http
GET    /admin/audit-logs              获取审计日志列表
GET    /admin/audit-logs/stats        获取审计日志统计
GET    /admin/audit-logs/:id          获取审计日志详情
GET    /admin/audit-logs/export       导出审计日志
```

## 🛡️ 安全架构

### 认证授权机制

```typescript
// 认证流程
1. 用户登录 → JWT Token生成
2. 请求携带 Authorization: Bearer <token>
3. AuthGuard验证Token有效性
4. RolesGuard验证用户权限
5. 执行业务逻辑

// 权限控制装饰器
@AdminRoles('admin', 'super_admin')  // 角色级权限
@Permissions('company:create')       // 功能级权限 (待实现)
```

### Guard守卫系统

| 守卫名称 | 作用 | 应用范围 |
|---------|------|---------|
| AdminAuthGuard | 验证管理员身份 | 所有admin接口 |
| AdminRolesGuard | 验证管理员角色 | 需要特定角色的接口 |
| PermissionGuard | 验证细粒度权限 | 待实现 |

### 数据验证机制

```typescript
// DTO验证管道
1. 请求数据 → ValidationPipe
2. class-validator装饰器验证
3. class-transformer数据转换
4. 验证失败 → 400 Bad Request
5. 验证通过 → 进入Controller

// 验证装饰器示例
@IsString()
@MinLength(3)
@MaxLength(50)
username: string;
```

## 🔧 技术栈详情

### 后端技术栈

| 技术组件 | 版本 | 用途 |
|---------|------|------|
| NestJS | 9.x | Node.js应用框架 |
| TypeScript | 4.x | 类型安全的JavaScript |
| TypeORM | 0.3.x | 对象关系映射 |
| MySQL | 8.0+ | 关系型数据库 |
| Redis | 6.x+ | 缓存和会话存储 |
| class-validator | 0.14.x | 数据验证 |
| class-transformer | 0.5.x | 数据转换 |
| bcrypt | 5.x | 密码加密 |
| jsonwebtoken | 9.x | JWT令牌处理 |
| @nestjs/swagger | 6.x | API文档生成 |

### 外部服务集成

| 服务名称 | 提供商 | 集成状态 | 用途 |
|---------|--------|---------|------|
| 翻译API | 火山引擎 | ✅ 已集成 | 多语言翻译 |
| 对象存储TOS | 火山引擎 | ✅ 已配置 | 文件存储 |
| 支付网关 | 待选择 | ❌ 待集成 | 在线支付 |
| 短信服务 | 待选择 | ❌ 待集成 | 验证码发送 |
| 邮件服务 | 待选择 | ❌ 待集成 | 邮件通知 |

## 📈 性能与优化

### 数据库优化

```sql
-- 主要索引策略
CREATE INDEX idx_company_status ON companies(status);
CREATE INDEX idx_product_status_category ON products(status, category);
CREATE INDEX idx_inquiry_status_created ON inquiries(status, created_at);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_admin_username ON admin_users(username);

-- 分页查询优化
-- 使用LIMIT + OFFSET实现分页
-- 支持ORDER BY性能优化
```

### 查询优化策略

| 优化类型 | 实现方式 | 效果 |
|---------|---------|------|
| 关联查询 | leftJoinAndSelect | 减少N+1查询 |
| 分页查询 | LIMIT + OFFSET | 控制返回数据量 |
| 条件筛选 | WHERE子句优化 | 减少数据扫描 |
| 字段选择 | select指定字段 | 减少数据传输 |

### 缓存策略

```typescript
// Redis缓存应用场景 (待实现)
1. 用户会话缓存 - 30分钟TTL
2. 权限数据缓存 - 1小时TTL
3. 统计数据缓存 - 5分钟TTL
4. 配置数据缓存 - 24小时TTL
```

## 🚀 部署架构

### 环境配置

```bash
# 开发环境
NODE_ENV=development
APP_PORT=3010
DB_HOST=localhost
DB_PORT=3306
REDIS_HOST=localhost
REDIS_PORT=6379

# 生产环境
NODE_ENV=production
APP_PORT=3010
DB_HOST=mysql-prod-server
DB_PORT=3306
REDIS_HOST=redis-prod-server
REDIS_PORT=6379
```

### Docker容器化

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3010
CMD ["npm", "run", "start:prod"]
```

### 监控与日志

| 监控类型 | 工具选择 | 实现状态 |
|---------|---------|---------|
| 应用监控 | 待选择 | ❌ 待实现 |
| 错误追踪 | NestJS Logger | ✅ 已实现 |
| 性能监控 | 待选择 | ❌ 待实现 |
| 日志收集 | 待选择 | ❌ 待实现 |

## 📋 API文档

### Swagger文档配置

```typescript
// 自动生成API文档
访问地址: http://localhost:3010/api
文档特性:
- 自动根据DTO生成请求/响应模型
- 支持在线测试接口
- 包含详细的参数说明
- 错误码和状态码说明
```

### 请求响应格式

```typescript
// 统一响应格式
{
  "data": any,           // 业务数据
  "meta"?: {             // 分页信息(可选)
    "totalItems": number,
    "itemCount": number,
    "itemsPerPage": number,
    "totalPages": number,
    "currentPage": number
  },
  "message"?: string     // 提示信息(可选)
}

// 错误响应格式
{
  "statusCode": number,
  "message": string | string[],
  "error": string
}
```

## 🎯 技术债务与改进建议

### 当前技术债务

1. **单元测试覆盖率低** - 需要补充控制器和服务层测试
2. **API限流缺失** - 需要添加接口调用频率限制
3. **缓存机制待完善** - Redis缓存策略需要实现
4. **监控体系缺失** - 需要集成APM和日志收集

### 性能优化建议

1. **数据库连接池优化** - 调整连接池大小和超时设置
2. **查询语句优化** - 使用索引和避免N+1查询
3. **分页查询优化** - 大数据量时使用游标分页
4. **图片资源优化** - 集成CDN和图片压缩服务

### 安全加固建议

1. **输入验证加强** - 添加XSS和SQL注入防护
2. **访问日志记录** - 记录所有敏感操作
3. **API版本控制** - 支持向后兼容的版本管理
4. **HTTPS强制** - 生产环境强制使用HTTPS

这个技术架构文档为系统的进一步开发和维护提供了全面的参考基础。