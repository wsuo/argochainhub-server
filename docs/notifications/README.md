# 管理员通知系统文档

## 📚 文档目录

### 🚀 快速上手
- [**快速上手指南**](quick-start.md) - 5分钟了解核心功能和用法

### 📖 完整文档
- [**接口对接文档**](admin-notification-api-guide.md) - 详细的API接口文档，包含所有接口的请求体、响应体和业务流程说明

### 🔧 开发参考
- [**字典数据指南**](dictionary-guide.md) - 字典类型获取和前端枚举定义
- [**技术实现文档**](technical-implementation.md) - 技术架构和实现细节
- [**开发进度记录**](development-progress.md) - 开发过程和问题解决记录

### 🧪 测试工具
- [**API测试文档**](api-testing.md) - 测试脚本和测试用例
- **测试脚本**: `../../test/test-admin-notifications.sh`
- **WebSocket测试页面**: `../../test/websocket-test.html`

## 🎯 核心功能

### ✨ 主要特性
- **实时WebSocket推送**: 管理员连接后可实时接收通知
- **基于权限的智能分发**: 根据管理员权限推送相关通知
- **多种优先级支持**: CRITICAL、HIGH、NORMAL等5个级别
- **18种业务通知类型**: 覆盖用户注册、企业认证、产品审核等业务场景
- **系统监控告警**: 自动检测系统健康状况并发送告警

### 📱 前端集成
- 支持Vue、React等主流前端框架
- 提供完整的TypeScript类型定义
- 包含WebSocket断线重连机制
- 提供UI组件设计建议

### 🔒 安全特性
- JWT Token认证
- 权限级别控制
- WebSocket连接安全验证

## 📊 系统监控

### 自动监控指标
- **内存使用率**: 85%以上发送WARNING，95%以上发送CRITICAL
- **CPU负载**: 150%以上发送CRITICAL告警
- **磁盘使用**: 90%以上发送WARNING，95%以上发送CRITICAL
- **业务指标**: 待审核数量、用户活跃度等

### 监控频率
- 系统健康检查：每5分钟自动执行
- 业务指标统计：实时更新
- WebSocket连接状态：实时监控

## 🚦 快速测试

### 1. HTTP API测试
```bash
# 进入项目根目录
cd /Users/wshuo/Developer/my/argochainhub-server

# 运行测试脚本
./test/test-admin-notifications.sh
```

### 2. WebSocket测试
```bash
# 在浏览器中打开测试页面
open ./test/websocket-test.html
```

## 📞 技术支持

### 文档问题
如发现文档错误或不清楚的地方，请联系后端开发团队。

### 集成问题
参考以下顺序排查：
1. 查看[快速上手指南](quick-start.md)
2. 运行测试脚本验证功能
3. 查看[完整API文档](admin-notification-api-guide.md)
4. 联系技术支持

### 版本信息
- **文档版本**: v1.0
- **API版本**: v1
- **最后更新**: 2025-08-06
- **维护团队**: 后端开发团队

---

## 📋 更新日志

### v1.0 (2025-08-06)
- ✅ 完整的管理员通知系统实现
- ✅ WebSocket实时推送功能
- ✅ 基于权限的通知分发
- ✅ 系统监控和告警机制
- ✅ 完整的API文档和测试工具
- ✅ 前端集成示例和TypeScript类型定义

---

## 📁 用户端通知系统文档

本目录主要包含**管理员通知系统**的文档。如需了解**用户端通知系统**，请查看以下文档：

### 用户端通知功能概述
- **数据库表**: `notifications` (用户通知)
- **WebSocket命名空间**: `/notifications`
- **主要功能**: 
  - 询价单通知 (INQUIRY_NEW, INQUIRY_QUOTED)
  - 产品审核通知 (PRODUCT_APPROVED, PRODUCT_REJECTED)
  - 企业认证通知 (COMPANY_APPROVED)
  - 会员到期提醒 (SUBSCRIPTION_EXPIRING)

### 用户端接口路径
- `GET /api/v1/notifications` - 用户通知列表
- `PATCH /api/v1/notifications/{id}/read` - 标记已读
- `POST /api/v1/auth/refresh-token` - Token刷新

### 技术架构
- 使用Socket.IO实现WebSocket连接
- JWT Token认证
- 支持企业认证通过时自动Token刷新
- 完整的断线重连机制

用户端通知系统已经完整实现并经过测试，详细的技术实现请参考本目录下的历史文档。