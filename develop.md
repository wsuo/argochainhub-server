智慧农化采购平台 (Argochainhub) 后端技术设计文档
1. 系统架构
系统采用前后端分离的单体后端架构。一个统一的NestJS应用为所有客户端（用户端Web、管理后台Web）提供RESTful API服务。服务本身将是无状态的，便于未来进行水平扩展。
Generated mermaid
      graph TD
    subgraph "客户端"
        UserClient[用户端 Web (React)]
        AdminClient[管理后台 Web (React)]
    end

    subgraph "基础设施 (云服务器)"
        Nginx[Nginx 反向代理/API网关]
        subgraph "Docker 容器"
            NestApp[NestJS API 服务]
        end
        FastGPT[FastGPT 服务 (独立部署)]
    end

    subgraph "数据库服务"
        MySQL[MySQL 数据库 (RDS)]
    end

    UserClient --> Nginx
    AdminClient --> Nginx
    Nginx -- /api/v1 --> NestApp
    NestApp -- 数据库操作 --> MySQL
    NestApp -- AI知识库查询 --> FastGPT
2. 数据库设计 (MySQL Schema)
这是系统的基石。所有表建议使用InnoDB引擎，字符集为utf8mb4。主键统一为id (BIGINT, Auto Increment)，并包含created_at和updated_at时间戳。使用deleted_at实现软删除。
好的，收到您的要求。我将采用您指定的简洁格式，并力求全面，覆盖从用户管理到业务全流程的所有必要数据库表。这种格式更便于快速概览和在团队内部沟通。

---
智慧农化采购平台 (Argochainhub) 数据库表结构设计 (完整版)
3. 基础与用户管理 (Base & User Management)
- companies (企业/租户表)
  - id (PK, BIGINT UNSIGNED)
  - name (VARCHAR) - 企业全称
  - type (ENUM: 'buyer', 'supplier') - 企业类型
  - status (ENUM: 'pending_review', 'active', 'disabled') - 企业状态
  - profile (JSON) - 企业简介、地址、联系电话、官网、资质证书URL等
  - rating (DECIMAL) - (供应商) 平台综合评分
  - is_top_100 (BOOLEAN) - (供应商) 是否为Top100
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - deleted_at (TIMESTAMP, NULL) - 软删除标记
- users (用户账户表)
  - id (PK, BIGINT UNSIGNED)
  - company_id (FK to companies.id) - 所属企业
  - email (VARCHAR, UNIQUE) - 登录邮箱
  - password (VARCHAR) - 加盐哈希后的密码
  - name (VARCHAR) - 用户姓名
  - role (ENUM: 'owner', 'admin', 'member') - 在企业内的角色
  - is_active (BOOLEAN) - 账户是否激活
  - last_login_at (TIMESTAMP, NULL) - 最后登录时间
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - deleted_at (TIMESTAMP, NULL)
4. 会员与财务 (Membership & Finance)
- plans (会员计划表)
  - id (PK, INT UNSIGNED)
  - name (VARCHAR) - 计划名称 (如：基础版, 高级版)
  - price (DECIMAL) - 价格 (美元)
  - duration_days (INT) - 周期 (天)
  - is_active (BOOLEAN) - 是否上架可供购买
  - specs (JSON) - 配额详情: {"user_accounts": 3, "ai_queries_monthly": 1000, "inquiries_monthly": 100, ...}
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
- subscriptions (企业订阅记录表)
  - id (PK, BIGINT UNSIGNED)
  - company_id (FK to companies.id)
  - plan_id (FK to plans.id)
  - order_id (FK to orders.id, NULL) - 关联的购买订单
  - start_date (DATETIME) - 订阅生效日期
  - end_date (DATETIME) - 订阅到期日期
  - type (ENUM: 'trial', 'paid', 'gift') - 订阅类型 (试用/付费/赠送)
  - status (ENUM: 'active', 'expired', 'cancelled') - 订阅状态
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
- orders (支付订单表)
  - id (PK, BIGINT UNSIGNED)
  - order_no (VARCHAR, UNIQUE) - 订单业务编号
  - company_id (FK to companies.id) - 购买方
  - user_id (FK to users.id) - 下单用户
  - plan_name (VARCHAR) - (冗余) 购买的计划名称
  - amount (DECIMAL) - 订单金额
  - status (ENUM: 'pending_payment', 'paid', 'failed', 'refunded') - 支付状态
  - paid_at (TIMESTAMP, NULL) - 支付成功时间
  - payment_gateway_txn_id (VARCHAR, NULL) - 支付网关交易号
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
5. 产品与内容 (Product & Content)
- products (农药产品表)
  - id (PK, BIGINT UNSIGNED)
  - supplier_id (FK to companies.id) - 所属供应商
  - name (VARCHAR) - 产品通用名或商品名
  - category (VARCHAR) - 产品分类
  - cas_no (VARCHAR, NULL) - CAS化学文摘号
  - formulation (VARCHAR) - 剂型
  - active_ingredient (VARCHAR) - 有效成分
  - content (VARCHAR) - 有效成分含量
  - description (TEXT) - 产品描述
  - details (JSON) - 详细规格 (毒性、理化性质、包装规格等)
  - status (ENUM: 'draft', 'pending_review', 'active', 'rejected', 'archived') - 产品状态
  - rejection_reason (TEXT, NULL) - 驳回原因
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
  - deleted_at (TIMESTAMP, NULL)
6. 核心业务流程 (Core Business Flow)
- inquiries (询价单主表)
  - id (PK, BIGINT UNSIGNED)
  - inquiry_no (VARCHAR, UNIQUE) - 询价单业务编号
  - buyer_id (FK to companies.id) - 发起方
  - supplier_id (FK to companies.id) - 接收方
  - status (ENUM: 'pending_quote', 'quoted', 'confirmed', 'declined', 'expired', 'cancelled')
  - details (JSON) - 询价单主体信息: {"delivery_location": "...", "trade_terms": "FOB", "payment_method": "T/T", "buyer_remarks": "..."}
  - quote_details (JSON, NULL) - 供应商报价详情: {"total_price": 10000, "valid_until": "...", "supplier_remarks": "..."}
  - deadline (DATE) - 报价截止日期
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
- inquiry_items (询价产品项)
  - id (PK, BIGINT UNSIGNED)
  - inquiry_id (FK to inquiries.id)
  - product_id (FK to products.id)
  - product_snapshot (JSON) - 当时产品核心信息的快照
  - quantity (DECIMAL) - 询价数量
  - unit (VARCHAR) - 数量单位
  - packaging_req (VARCHAR, NULL) - 包装要求
- sample_requests (样品申请单)
  - id (PK, BIGINT UNSIGNED)
  - sample_req_no (VARCHAR, UNIQUE) - 样品申请业务编号
  - buyer_id (FK to companies.id)
  - supplier_id (FK to companies.id)
  - product_id (FK to products.id)
  - product_snapshot (JSON) - 产品快照
  - quantity (DECIMAL) - 申请数量
  - unit (VARCHAR) - 单位
  - status (ENUM: 'pending_approval', 'approved', 'shipped', 'delivered', 'rejected', 'cancelled')
  - details (JSON) - 申请详情: {"purpose": "...", "shipping_address": "...", "shipping_method": "DHL", "willingness_to_pay": {"paid": true, "amount": 50}}
  - tracking_info (JSON, NULL) - 物流信息: {"carrier": "DHL", "tracking_number": "..."}
  - deadline (DATE) - 期望处理截止日期
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
- registration_requests (登记申请单)
  - id (PK, BIGINT UNSIGNED)
  - reg_req_no (VARCHAR, UNIQUE) - 登记申请业务编号
  - buyer_id (FK to companies.id)
  - supplier_id (FK to companies.id)
  - product_id (FK to products.id)
  - product_snapshot (JSON) - 产品快照
  - status (ENUM: 'pending_response', 'in_progress', 'completed', 'declined', 'cancelled')
  - details (JSON) - 申请详情: {"target_country": "Brazil", "is_exclusive": true, "doc_reqs": ["ICAMA", "GLP"], "sample_req": {"needed": true, "quantity": 100, "unit": "g"}, ...} (包含表单所有字段)
  - deadline (DATE) - 期望响应截止日期
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
7. 系统与辅助 (System & Auxiliary)
- communications (沟通记录表)
  - id (PK, BIGINT UNSIGNED)
  - related_service (ENUM: 'inquiry', 'sample', 'registration') - 关联的业务类型
  - related_id (BIGINT UNSIGNED) - 关联的业务ID (如inquiries.id)
  - sender_id (FK to users.id) - 发送者
  - message (TEXT) - 消息内容
  - created_at (TIMESTAMP)
  - 这是一个多态关联(Polymorphic Association)的设计，用于存储所有业务单据下的沟通历史。
- attachments (附件表)
  - id (PK, BIGINT UNSIGNED)
  - related_service (ENUM: 'company_profile', 'inquiry', 'sample', 'registration', 'communication') - 关联的业务
  - related_id (BIGINT UNSIGNED) - 关联的业务ID
  - uploader_id (FK to users.id)
  - file_name (VARCHAR) - 原始文件名
  - file_path (VARCHAR) - 在云存储(如S3)上的路径或URL
  - file_size (INT) - 文件大小(Bytes)
  - file_type (VARCHAR) - MIME类型
  - created_at (TIMESTAMP)
  - 同样采用多态关联，统一管理全站所有上传的文件。
- admin_users (后台管理员表)
  - id (PK, INT UNSIGNED)
  - username (VARCHAR, UNIQUE)
  - password (VARCHAR)
  - role (VARCHAR) - 角色 (如：super_admin, operator)
  - is_active (BOOLEAN)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
- audit_logs (后台操作日志表)
  - id (PK, BIGINT UNSIGNED)
  - admin_user_id (FK to admin_users.id)
  - action (VARCHAR) - 操作描述 (如: "审核通过供应商")
  - target_resource (VARCHAR) - 操作对象 (如: "companies")
  - target_id (BIGINT UNSIGNED) - 操作对象ID
  - details (JSON, NULL) - 操作前后的数据变化详情
  - ip_address (VARCHAR)
  - created_at (TIMESTAMP)

---
8. API 接口设计 (RESTful API)
统一规范:
- 根路径: 所有API路径以 /api/v1 开头。
- 认证: 除公开接口外，所有接口需在请求头 Authorization 中携带 Bearer <JWT> 进行认证。
- 成功响应: 2xx 状态码，返回数据包裹在 data 字段中。
- Generated json
      { "statusCode": 200, "message": "Success", "data": { ... } }
- 错误响应: 4xx 或 5xx 状态码，返回包含错误信息的JSON。
- Generated json
      { "statusCode": 404, "message": "Resource not found", "error": "Not Found" }
- IGNORE_WHEN_COPYING_START
-  content_copy  download 
-  Use code with caution. Json
- IGNORE_WHEN_COPYING_END
- 分页: 所有列表接口支持 ?page=1&limit=20 参数进行分页。响应中应包含分页信息。
- Generated json
      { "data": [...], "meta": { "totalItems": 100, "itemCount": 20, "itemsPerPage": 20, "totalPages": 5, "currentPage": 1 } }
- IGNORE_WHEN_COPYING_START
-  content_copy  download 
-  Use code with caution. Json
- IGNORE_WHEN_COPYING_END

---
8.1 公开接口 (Public - 无需认证)
- GET /plans
  - 描述: 获取所有上架可供购买的会员计划列表。
  - 响应: 200 OK - 返回会员计划对象数组。

---
8.2 认证接口 (/auth)
- POST /auth/register
  - 描述: 企业用户注册。
  - 请求体: { "companyName": "...", "companyType": "buyer", "userName": "...", "email": "...", "password": "..." }
  - 响应: 201 CREATED - 返回成功消息，通常不直接登录，提示用户查收验证邮件或等待审核。
- POST /auth/login
  - 描述: 用户登录。
  - 请求体: { "email": "...", "password": "..." }
  - 响应: 200 OK - 返回 { "accessToken": "...", "user": { ... } }。
- POST /auth/logout
  - 描述: 用户登出（可选，主要用于让服务端的JWT黑名单生效）。
  - 响应: 200 OK - 返回成功消息。
- GET /auth/me
  - 描述: 获取当前登录用户的信息。
  - 认证: JWT
  - 响应: 200 OK - 返回当前用户对象及其所属公司信息。
- PUT /auth/change-password
  - 描述: 修改当前登录用户的密码。
  - 认证: JWT
  - 请求体: { "oldPassword": "...", "newPassword": "..." }
  - 响应: 200 OK - 返回成功消息。

---
8.3 用户端通用接口 (Client - JWT认证)
- GET /profile/company
  - 描述: 获取当前用户所属公司的详细信息。
  - 响应: 200 OK - 返回公司对象。
- PUT /profile/company
  - 描述: 更新当前用户所属公司的信息（如简介、联系方式）。
  - 响应: 200 OK - 返回更新后的公司对象。
- GET /profile/subscription
  - 描述: 获取当前公司的会员订阅状态及配额使用情况。
  - 响应: 200 OK - 返回订阅对象。
- GET /products
  - 描述: (采购商视角) 搜索/浏览所有上架产品。
  - 查询参数: ?search=...&category=...&page=1&limit=20
  - 响应: 200 OK - 返回分页的产品列表。
- GET /products/:id
  - 描述: 获取单个产品的详细信息。
  - 响应: 200 OK - 返回产品对象及其供应商信息。
- GET /suppliers
  - 描述: (采购商视角) 搜索/浏览所有已激活的供应商。
  - 查询参数: ?search=...&page=1&limit=20
  - 响应: 200 OK - 返回分页的供应商列表。
- GET /suppliers/top100
  - 描述: 获取Top 100供应商列表。
  - 响应: 200 OK - 返回供应商对象数组。
- GET /suppliers/:id
  - 描述: 获取单个供应商的公司主页信息。
  - 响应: 200 OK - 返回公司对象。
这是一个统一模式的设计，以inquiries为例，sample-requests和registration-requests结构完全一致。
- POST /inquiries
  - 描述: (采购商) 创建并发起一个新的询价单。
  - 请求体: { "supplierId": ..., "details": { ... }, "items": [{ "productId": ..., "quantity": ..., "unit": "..." }] }
  - 响应: 201 CREATED - 返回新创建的询价单对象。
- GET /inquiries
  - 描述: (采购商/供应商) 获取询价单列表。后端根据用户角色自动返回“我发出的”或“我收到的”。
  - 查询参数: ?status=...&page=1&limit=20
  - 响应: 200 OK - 返回分页的询价单列表。
- GET /inquiries/:id
  - 描述: 获取单个询价单的详细信息，包括沟通记录和附件。
  - 响应: 200 OK - 返回完整的询价单对象。
- PATCH /inquiries/:id/quote
  - 描述: (供应商) 对询价单进行报价。
  - 请求体: { "quoteDetails": { ... } }
  - 响应: 200 OK - 返回更新后的询价单对象。
- PATCH /inquiries/:id/confirm
  - 描述: (采购商) 确认供应商的报价。
  - 响应: 200 OK - 返回更新后的询价单对象。
- PATCH /inquiries/:id/decline
  - 描述: (采购商/供应商) 拒绝询价或报价。
  - 请求体: { "reason": "..." }
  - 响应: 200 OK - 返回更新后的询价单对象。
- PATCH /inquiries/:id/cancel
  - 描述: (采购商) 在对方处理前取消询价。
  - 响应: 200 OK - 返回更新后的询价单对象。
- POST /communications
  - 描述: 在某个业务单据下发表一条沟通消息。
  - 请求体: { "relatedService": "inquiry", "relatedId": 123, "message": "..." }
  - 响应: 201 CREATED - 返回新创建的消息对象。
- POST /attachments
  - 描述: 上传一个附件并关联到某个业务。
  - 请求体: multipart/form-data 包含 file, relatedService, relatedId
  - 响应: 201 CREATED - 返回附件对象信息（含URL）。

---
8.4 供应商特定接口 (/my-company)
- GET /my-company/products
  - 描述: (供应商) 获取自己公司的产品列表。
  - 查询参数: ?status=...&search=...&page=1&limit=20
  - 响应: 200 OK - 返回分页的产品列表。
- POST /my-company/products
  - 描述: (供应商) 创建一个新产品（默认为草稿或待审核）。
  - 请求体: { "name": "...", "category": "...", ... }
  - 响应: 201 CREATED - 返回新创建的产品对象。
- GET /my-company/products/:id
  - 描述: (供应商) 获取自己公司单个产品的详情。
  - 响应: 200 OK - 返回产品对象。
- PUT /my-company/products/:id
  - 描述: (供应商) 更新自己公司的产品信息。
  - 请求体: { "name": "...", "category": "...", ... }
  - 响应: 200 OK - 返回更新后的产品对象。
- DELETE /my-company/products/:id
  - 描述: (供应商) 删除一个产品（软删除）。
  - 响应: 204 No Content
- PATCH /my-company/products/:id/submit-review
  - 描述: (供应商) 将产品提交审核。
  - 响应: 200 OK - 返回更新状态后的产品对象。

---
8.5 管理后台接口 (/admin)
所有后台接口都需要管理员角色的JWT认证
- GET /admin/dashboard/kpis
  - 描述: 获取仪表盘核心KPI数据。
  - 响应: 200 OK - 返回 { "newUsersToday": ..., "totalRevenue": ..., ... }。
- GET /admin/dashboard/charts
  - 描述: 获取图表所需的数据。
  - 查询参数: ?chart=userGrowth&period=monthly
  - 响应: 200 OK - 返回图表数据。
- GET /admin/companies
  - 描述: 获取所有企业列表。
  - 查询参数: ?type=...&status=...&search=...
  - 响应: 200 OK - 返回分页的企业列表。
- GET /admin/companies/:id
  - 描述: 获取单个企业详情，包含其下所有用户和业务记录。
  - 响应: 200 OK - 返回聚合的企业对象。
- PUT /admin/companies/:id
  - 描述: 更新企业信息。
  - 响应: 200 OK - 返回更新后的企业对象。
- PATCH /admin/companies/:id/status
  - 描述: 审核或禁用/启用企业。
  - 请求体: { "status": "active", "reason": "审核通过" }
  - 响应: 200 OK。
- POST /admin/companies/:id/subscription
  - 描述: 手动为企业赠送或调整会员订阅。
  - 请求体: { "planId": ..., "endDate": "...", "type": "gift" }
  - 响应: 201 CREATED。
- GET /admin/users
  - 描述: 获取所有用户列表。
  - 查询参数: ?search=...&companyId=...
  - 响应: 200 OK - 返回分页的用户列表。
- PUT /admin/users/:id/status
  - 描述: 激活或禁用单个用户账户。
  - 请求体: { "isActive": false }
  - 响应: 200 OK。
- GET /admin/products
  - 描述: 查看全平台所有产品。
  - 查询参数: ?status=pending_review&supplierId=...
  - 响应: 200 OK - 返回分页的产品列表。
- PATCH /admin/products/:id/review
  - 描述: 审核产品。
  - 请求体: { "status": "active", "rejectionReason": "..." }
  - 响应: 200 OK。
- GET /admin/inquiries, /admin/sample-requests, /admin/registration-requests
  - 描述: 查看全平台所有业务单据（用于客服和仲裁）。
  - 查询参数: ?search=...&status=...
  - 响应: 200 OK - 返回分页的列表。
- GET /admin/plans
  - 描述: 获取所有会员计划（包括未上架的）。
  - 响应: 200 OK - 返回计划列表。
- POST /admin/plans
  - 描述: 创建新的会员计划。
  - 请求体: { "name": "...", "price": ..., "specs": { ... } }
  - 响应: 201 CREATED。
- PUT /admin/plans/:id
  - 描述: 更新会员计划。
  - 响应: 200 OK。
- GET /admin/audit-logs
  - 描述: 查看后台操作日志。
  - 查询参数: ?adminUserId=...&action=...
  - 响应: 200 OK - 返回分页的日志列表。
核心业务逻辑实现要点
9. 认证与授权 (Authentication & Authorization)
这是系统的第一道门，也是最重要的一道。我们将使用 NestJS Guards 来实现分层、可复用的权限控制。
流程图:
客户端请求 -> JWT AuthGuard -> (可选) RoleGuard (Admin) -> (可选) TypeGuard (Buyer/Supplier) -> Controller
实现细节:
- JwtAuthGuard (全局或按需应用)
  - 作用: 验证请求头中的JWT是否有效。
  - 逻辑:
    1. 从 Authorization: Bearer <token> 中提取 token。
    2. 使用预设的 JWT_SECRET 验证 token 的签名和有效期。
    3. 验证通过后，解码 payload (包含 userId, companyId, role, type)。
    4. 通过 userId 从数据库查询最新的用户信息，附加到 request 对象上（如 request.user）。
    5. 验证失败则抛出 401 UnauthorizedException。
- RoleGuard (仅用于后台 /admin 路由)
  - 作用: 确保只有特定角色的后台管理员能访问。
  - 逻辑:
    1. 依赖于 JwtAuthGuard 先执行，确保 request.user 存在。
    2. 从路由元数据（@SetMetadata('roles', ['super_admin'])）获取允许的角色列表。
    3. 检查 request.user.role 是否在允许列表中。
    4. 不匹配则抛出 403 ForbiddenException。
- TypeGuard (用于区分采购商/供应商的路由)
  - 作用: 确保只有特定企业类型的用户能访问。例如，只有buyer才能发起询价。
  - 逻辑:
    1. 依赖于 JwtAuthGuard，获取 request.user.company.type。
    2. 从路由元数据（@SetMetadata('types', ['buyer'])）获取允许的企业类型。
    3. 检查 request.user.company.type 是否在允许列表中。
    4. 不匹配则抛出 403 ForbiddenException。
示例代码（伪代码）:
Generated typescript
      // 在 Controller 中使用@Post('/inquiries')@UseGuards(JwtAuthGuard, TypeGuard)@SetMetadata('types', ['buyer']) // 只有采购商能访问
createInquiry(@Request() req, @Body() createInquiryDto: CreateInquiryDto) {
  const currentUser = req.user; // 已被Guard附加的用户信息return this.inquiriesService.create(currentUser, createInquiryDto);
}
10. SaaS多租户数据隔离 (Data Isolation)
核心原则：绝不相信客户端传来的 companyId，一切以认证后 request.user 中的 companyId 为准。
实现细节:
- 在 Service 层强制隔离:
  - 所有Service方法都应接收 currentUser 对象作为第一个参数。
  - 在使用数据库查询工具（如TypeORM/Prisma）时，where 条件必须包含租户ID。
示例代码（伪代码，使用 TypeORM）:
Generated typescript
      // products.service.tsasync findMyProducts(currentUser: User, paginationDto: PaginationDto) {
  const [results, total] = await this.productsRepository.findAndCount({
    where: {
      supplierId: currentUser.companyId, // 关键！强制查询当前用户的公司ID
    },
    take: paginationDto.limit,
    skip: (paginationDto.page - 1) * paginationDto.limit,
  });
  return { data: results, meta: { ... } };
}
IGNORE_WHEN_COPYING_START
 content_copy  download 
 Use code with caution. TypeScript
IGNORE_WHEN_COPYING_END
- 防止跨租户访问:
  - 当用户尝试访问单个资源时（如 GET /inquiries/:id），必须同时验证资源归属。
示例代码（伪代码）:
Generated typescript
      // inquiries.service.tsasync findOne(currentUser: User, id: number) {
  const inquiry = await this.inquiriesRepository.findOne({ where: { id } });
  if (!inquiry) {
    throw new NotFoundException('Inquiry not found');
  }

  // 关键！检查该询价单是否属于当前用户（作为采购商或供应商）if (inquiry.buyerId !== currentUser.companyId && inquiry.supplierId !== currentUser.companyId) {
    throw new ForbiddenException('You do not have permission to access this resource');
  }
  return inquiry;
}
IGNORE_WHEN_COPYING_START
 content_copy  download 
 Use code with caution. TypeScript
IGNORE_WHEN_COPYING_END
11. 会员配额系统 (Quota System)
这是一个典型的 面向切面编程 (AOP) 的应用场景，使用 Guard 或 Interceptor 实现最优雅。
流程:
用户发起受限操作 -> QuotaGuard -> Controller -> Service
实现细节:
- QuotaGuard (应用于需要配额检查的路由)
  - 作用: 在执行核心逻辑前检查用户操作配额是否充足。
  - 逻辑:
    1. 依赖 JwtAuthGuard，获取 currentUser。
    2. 从路由元数据（@SetMetadata('quota_type', 'inquiry')）获取当前操作的配额类型。
    3. 调用 QuotaService 进行检查: await this.quotaService.check(currentUser.companyId, 'inquiry')。
    4. QuotaService 返回 true 则放行，返回 false 或抛出异常则由 Guard 捕获并抛出 403 ForbiddenException（配额不足）。
- QuotaService (核心配额计算服务)
  - check(companyId, quotaType) 方法逻辑:
    1. 查询 subscriptions 表，找到 companyId 当前 active 的订阅记录。若无，则视为免费版（配额为0或默认值）。
    2. 根据订阅的 plan_id，从 plans 表查询 specs JSON，获取 quotaType 对应的配额上限（如 inquiries_monthly: 100）。
    3. 根据 quotaType，查询对应的业务表（如 inquiries），统计该 companyId 在当前计费周期内（如本月）创建的记录数。
    4. 比较 已用数量 和 配额上限。如果 已用数量 >= 上限，返回 false。
    5. 否则返回 true。
  - 缓存优化: 可以在Redis中缓存每个公司的配额上限和当前已用数量，避免每次都查询数据库，以提升性能。
示例代码（伪代码）:
Generated typescript
      // 在 Controller 中使用@Post('/inquiries')@UseGuards(JwtAuthGuard, TypeGuard, QuotaGuard)@SetMetadata('types', ['buyer'])@SetMetadata('quota_type', 'inquiry') // 声明此操作消耗'inquiry'配额
createInquiry(...) { ... }
IGNORE_WHEN_COPYING_START
 content_copy  download 
 Use code with caution. TypeScript
IGNORE_WHEN_COPYING_END
12. 业务状态机管理 (Business State Machine)
系统的核心业务（询价、样品、登记）都是由状态驱动的。必须严格控制状态的流转，防止非法操作。
核心原则：操作的合法性取决于当前的状态。
实现细节:
- 在 Service 层进行状态检查:
  - 在执行任何状态变更操作前，必须先检查当前状态是否允许该操作。
示例代码（伪代码，询价流程）:
Generated typescript
      // inquiries.service.tsasync quote(currentUser: User, id: number, quoteDetails: QuoteDetailsDto) {
  // 1. 鉴权，确保是该询价单的供应商const inquiry = await this.inquiriesRepository.findOne({ where: { id, supplierId: currentUser.companyId } });
  if (!inquiry) {
    throw new NotFoundException('Inquiry not found or you are not the supplier');
  }

  // 2. 状态检查！if (inquiry.status !== 'pending_quote') {
    throw new BadRequestException(`Cannot quote on an inquiry with status '${inquiry.status}'`);
  }

  // 3. 执行操作
  inquiry.quoteDetails = quoteDetails;
  inquiry.status = 'quoted'; // 变更状态await this.inquiriesRepository.save(inquiry);

  // 4. (可选) 触发通知事件this.eventEmitter.emit('inquiry.quoted', inquiry);

  return inquiry;
}
IGNORE_WHEN_COPYING_START
 content_copy  download 
 Use code with caution. TypeScript
IGNORE_WHEN_COPYING_END
13. 异步任务与通知 (Async Tasks & Notifications)
对于耗时操作（如生成报表）或需要通知用户的场景（如下单成功、收到报价），应采用异步处理。
实现细节:
- NestJS 事件系统 (@nestjs/event-emitter)
  - 作用: 解耦业务逻辑。主流程完成核心操作后，发出一个事件，由一个或多个监听器去处理后续任务（如发邮件、发站内信）。
  - 流程:
    1. 在主业务逻辑（如inquiries.service）中注入 EventEmitter2。
    2. 操作成功后，调用 this.eventEmitter.emit('inquiry.quoted', { inquiryId: 123, buyerEmail: '...' })。
    3. 创建一个 NotificationsListener 服务，使用 @OnEvent('inquiry.quoted') 装饰器来监听该事件。
    4. 监听器方法中，实现发送邮件或创建站内信的逻辑。
示例代码（伪代码）:
Generated typescript
      // notifications.listener.ts@Injectable()
export class NotificationsListener {
  @OnEvent('inquiry.quoted')
  handleInquiryQuotedEvent(payload: { inquiryId: number; buyerEmail: string }) {
    console.log(`Sending email to ${payload.buyerEmail} about new quote for inquiry ${payload.inquiryId}`);
    // ... 调用邮件服务
  }
}
IGNORE_WHEN_COPYING_START
 content_copy  download 
 Use code with caution. TypeScript
IGNORE_WHEN_COPYING_END
这个设计模式使得核心业务代码保持简洁，将非核心的、可能耗时的任务剥离出去，提升了系统的响应速度和可维护性。
14. 非功能性需求
- 安全性
  - 使用bcrypt对用户密码进行加盐哈希。
  - 使用class-validator和class-transformer对所有请求的Body和Query参数进行严格的类型和格式验证。
  - 配置CORS，只允许指定的前端域名访问。
  - 使用helmet中间件增加基础的HTTP头安全。
- 性能
  - 为数据库表中经常用于查询条件的字段（如company_id, status, type）建立索引。
  - 所有返回列表的API必须实现分页（limit, offset）。
  - 考虑使用Redis缓存热点数据，如Top100供应商列表、会员计划等不常变化的数据。
- 日志
  - 使用Winston等日志库，按级别（INFO, WARN, ERROR）记录日志。
  - 所有API请求的入口和出口都应有日志记录（包含请求路径、方法、耗时）。
  - 所有捕获到的异常都必须详细记录其堆栈信息
