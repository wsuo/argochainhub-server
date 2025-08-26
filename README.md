# 智慧农化采购平台 (Agrochainhub)

🌾 **专业的B2B农化产品采购平台后端系统**

基于NestJS构建的现代化企业级农化产品采购平台，为农化行业提供完整的B2B交易解决方案。

## 🌐 在线演示

- **前端演示**: [https://agro.wsuo.top/](https://agro.wsuo.top/) - 企业用户端（采购商/供应商）
- **管理后台**: [https://agro-admin.wsuo.top/](https://agro-admin.wsuo.top/) - 系统管理员后台

### 🧪 测试账号

**企业用户端**:
- 采购商：`user1@example.com` / `testpass123`
- 供应商：`user2@example.com` / `testpass123`

**管理后台**:
- 演示账号(只读)：`demo` / `Demo123!`

## ✨ 核心功能特性

### 🏢 企业管理系统
- **多租户架构**: 支持采购商和供应商两种企业类型
- **企业认证**: 完整的企业资质审核流程
- **权限管理**: 企业所有者、管理员、普通员工分级权限
- **企业收藏**: 采购商可收藏优质供应商

### 📦 产品管理系统
- **产品发布**: 供应商发布农化产品信息
- **多语言支持**: 产品信息支持中文、英语、西班牙语
- **分类管理**: 完善的农化产品分类体系
- **产品审核**: 管理员审核产品发布
- **游客访问**: 支持未登录用户浏览前2页产品（登录可查看全部）

### 💰 询价报价流程
- **智能询价**: 采购商发起询价需求
- **供应商报价**: 供应商针对询价进行报价
- **价格谈判**: 多轮报价谈判机制
- **订单确认**: 双方达成一致后确认订单

### 🛒 购物车系统
- **商品收集**: 采购商将感兴趣的产品加入购物车
- **供应商分组**: 按供应商自动分组管理
- **批量操作**: 支持批量添加、删除、修改数量
- **快速询价**: 购物车商品可一键转为询价单

### 💳 订阅配额系统
- **会员套餐**: 基础版、专业版、企业版多种套餐
- **配额管理**: 产品发布数量、询价次数等配额限制
- **自动续费**: 支持自动续费和手动续费
- **使用统计**: 详细的配额使用统计

### 🔔 智能通知系统
- **实时通知**: 业务事件实时推送通知
- **通知分类**: 系统通知、业务通知、审核通知
- **优先级管理**: 严重、紧急、高、普通、低优先级分级
- **管理员通知**: 企业审核、异常监控等管理通知

### 🤖 AI对话系统
- **智能问答**: 基于OpenRouter的AI对话功能
- **行业知识**: 针对农化行业的专业问答
- **多轮对话**: 支持上下文相关的多轮对话
- **热门查询**: 展示热门问题和答案
- **对话搜索**: 历史对话内容搜索

### 📊 样品管理系统
- **样品申请**: 采购商可申请产品样品
- **样品追踪**: 完整的样品申请和处理流程
- **物流跟踪**: 样品寄送状态跟踪

### 📰 信息发布系统
- **行业资讯**: 农化行业最新资讯发布
- **公告通知**: 平台公告和政策通知
- **内容管理**: 富文本编辑器支持

### 📁 文件管理系统
- **文件上传**: 支持图片、文档等多种格式
- **云存储**: 基于火山引擎TOS对象存储
- **文件预览**: 图片在线预览功能
- **权限控制**: 文件访问权限管理

### 🔍 数据管理系统
- **农药数据**: 中国农药信息网数据集成
- **价格趋势**: 农化产品价格趋势分析
- **图像识别**: 农药标签图像解析功能
- **数据字典**: 统一的数据字典管理

## 🛠 技术架构

### 核心技术栈
- **后端框架**: NestJS 11.x + TypeScript
- **数据库**: MySQL 8.x + TypeORM
- **认证授权**: JWT + Passport.js
- **API文档**: Swagger/OpenAPI 3.0
- **文件存储**: 火山引擎TOS对象存储
- **邮件服务**: Nodemailer + QQ邮箱
- **任务调度**: @nestjs/schedule
- **WebSocket**: Socket.IO
- **事件系统**: EventEmitter2

### 架构特点
- **分层架构**: Controller → Service → Repository 清晰分层
- **Guard系统**: JWT认证、角色权限、企业类型、配额控制多层Guard
- **DTO验证**: class-validator + class-transformer 数据验证
- **错误处理**: 全局异常过滤器和统一错误响应
- **配置管理**: 基于环境的配置管理系统
- **日志系统**: 结构化日志记录

### 数据库设计
包含30+张表的完整业务模型：
- **用户相关**: users, companies, company_users
- **产品相关**: products, categories, attachments
- **交易相关**: inquiries, inquiry_items, orders
- **系统相关**: plans, subscriptions, quotas, notifications
- **内容相关**: news, ai_conversations, samples
- **数据相关**: pesticides, price_trends, dictionaries

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- MySQL >= 8.x
- npm >= 9.x

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd argochainhub-server
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件配置数据库等信息：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=argochainhub

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 火山引擎TOS配置
VOLC_ACCESS_KEY_ID=your_access_key
VOLC_ACCESS_KEY_SECRET=your_secret_key
TOS_REGION=cn-beijing
TOS_BUCKET=your_bucket

# 应用配置
APP_PORT=3050
NODE_ENV=development
```

4. **初始化数据库**
```bash
# 运行数据库迁移
npm run typeorm:migration:run

# 初始化系统数据（管理员、测试企业、字典数据等）
npm run seed
```

5. **启动开发服务器**
```bash
npm run start:dev
```

访问地址：
- 应用服务: http://localhost:3050
- API文档: http://localhost:3050/api/docs

## 📚 API文档

### 接口规范
- **统一前缀**: `/api/v1`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: 统一的JSON响应格式
- **错误处理**: HTTP状态码 + 中文错误信息

### 主要API模块

#### 🔐 认证授权 (`/auth`)
```bash
POST /api/v1/auth/register          # 用户注册
POST /api/v1/auth/login            # 用户登录
POST /api/v1/auth/admin/login      # 管理员登录
POST /api/v1/auth/change-password  # 修改密码
POST /api/v1/auth/forgot-password  # 忘记密码
```

#### 🏢 企业管理 (`/companies`)
```bash
GET  /api/v1/companies/profile      # 获取企业信息
PUT  /api/v1/companies/profile      # 更新企业信息
GET  /api/v1/companies/suppliers    # 搜索供应商
POST /api/v1/companies/favorites    # 收藏供应商
GET  /api/v1/companies/users        # 企业用户管理
```

#### 📦 产品管理 (`/products`)
```bash
GET  /api/v1/products                # 搜索产品（游客可访问前2页）
GET  /api/v1/products/my-products   # 我的产品
POST /api/v1/products               # 发布产品
PUT  /api/v1/products/:id           # 更新产品
DELETE /api/v1/products/:id         # 删除产品
```

#### 💰 询价管理 (`/inquiries`)
```bash
GET  /api/v1/inquiries              # 询价单列表
POST /api/v1/inquiries              # 创建询价单
GET  /api/v1/inquiries/:id          # 询价单详情
POST /api/v1/inquiries/:id/quote    # 供应商报价
POST /api/v1/inquiries/:id/confirm  # 买家确认
```

#### 🛒 购物车管理 (`/cart`)
```bash
GET  /api/v1/cart                   # 获取购物车
POST /api/v1/cart/items             # 添加商品
PUT  /api/v1/cart/items/:id         # 更新商品
DELETE /api/v1/cart/items/batch     # 批量删除商品
```

#### 🔔 通知系统 (`/notifications`)
```bash
GET  /api/v1/notifications          # 获取通知列表
GET  /api/v1/notifications/unread-count # 未读数量
PATCH /api/v1/notifications/:id/read    # 标记已读
```

#### 🤖 AI对话 (`/ai-conversations`)
```bash
POST /api/v1/ai-conversations        # 发起对话
GET  /api/v1/ai-conversations        # 对话历史
GET  /api/v1/ai-conversations/popular-queries # 热门查询
POST /api/v1/ai-conversations/search # 搜索对话
```

#### 📁 文件管理 (`/uploads`)
```bash
POST /api/v1/uploads                 # 上传文件
GET  /api/v1/uploads/:id/url         # 获取文件URL
GET  /api/v1/uploads/:id/preview     # 预览图片
GET  /api/v1/uploads/my-files        # 我的文件
```

## 🌍 多语言支持

### 支持语言
- 🇨🇳 **中文 (zh-CN)** - 主要市场
- 🇺🇸 **英语 (en)** - 国际市场  
- 🇪🇸 **西班牙语 (es)** - 拉美市场

### 多语言字段格式
```json
{
  "zh-CN": "中文内容",
  "en": "English Content",
  "es": "Contenido en español"
}
```

### 支持多语言的实体
- **产品信息**: 产品名称、分类、描述、有效成分
- **企业信息**: 企业名称、简介
- **套餐信息**: 套餐名称、描述
- **字典数据**: 所有字典项的名称和描述

## 🔒 权限系统

### 用户角色
- **系统管理员**: 平台管理、企业审核、数据统计
- **企业所有者**: 企业最高权限、用户管理、订阅管理
- **企业管理员**: 企业业务管理、产品管理、询价管理
- **企业员工**: 基础业务操作权限

### 企业类型
- **采购商 (buyer)**: 发起询价、采购产品
- **供应商 (supplier)**: 发布产品、响应询价
- **服务商 (service_provider)**: 提供技术服务

### Guard系统
- **JwtAuthGuard**: JWT令牌验证
- **OptionalAuthGuard**: 可选认证（支持游客访问）
- **RoleGuard**: 基于角色的访问控制
- **CompanyTypeGuard**: 基于企业类型的访问控制
- **QuotaGuard**: 配额限制检查

## 💾 部署运维

### 生产环境构建
```bash
# 构建生产版本
npm run build

# 启动生产服务
npm run start:prod
```

### PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs argochainhub-server
```

### Docker部署
```bash
# 构建镜像
docker build -t argochainhub-server .

# 启动容器
docker run -d \
  --name argochainhub \
  -p 3050:3050 \
  -e NODE_ENV=production \
  argochainhub-server
```

### 数据库维护
```bash
# 生成迁移文件
npm run typeorm:migration:generate -- src/migrations/MigrationName

# 运行迁移
npm run typeorm:migration:run

# 回滚迁移
npm run typeorm:migration:revert

# 清空并重新初始化数据
npm run seed:clear && npm run seed
```

## 🧪 测试

### 运行测试
```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov

# 监听模式
npm run test:watch
```

### 代码质量
```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run build
```

## 📈 系统监控

### 性能监控
- API响应时间统计
- 数据库查询性能监控
- 内存使用率监控
- 错误率统计

### 业务监控
- 用户注册转化率
- 询价成功率
- 订阅续费率
- 活跃用户统计

### 日志管理
- 结构化日志记录
- 错误日志告警
- 访问日志分析
- 业务操作审计

## 🤝 贡献指南

### 开发规范
1. **代码规范**: 遵循ESLint和Prettier配置
2. **提交规范**: 使用Conventional Commits格式
3. **分支管理**: Git Flow工作流
4. **测试要求**: 新功能必须包含测试用例
5. **文档更新**: API变更需更新Swagger文档

### 贡献流程
1. Fork项目到个人仓库
2. 创建功能分支 `git checkout -b feature/new-feature`
3. 提交变更 `git commit -m 'feat: add new feature'`
4. 推送分支 `git push origin feature/new-feature`
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与联系

- **技术支持**: 通过GitHub Issues提交问题
- **商务合作**: 联系项目维护者
- **文档反馈**: 欢迎提交文档改进建议

---

*🌾 让农化采购更智能，让农业更美好！*