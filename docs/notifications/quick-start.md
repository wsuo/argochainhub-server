# 管理员通知系统 - 快速上手指南

## 🚀 5分钟上手

### 1. 获取管理员Token
```bash
curl -X POST "http://localhost:3050/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "Admin123!"}'
```

### 2. 获取通知列表
```bash
curl -X GET "http://localhost:3050/api/v1/admin/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 建立WebSocket连接
```javascript
// 1. 连接WebSocket时直接提供Token和类型
const token = 'your_admin_jwt_token';
const ws = new WebSocket(`ws://localhost:3050/notifications?token=${encodeURIComponent(token)}&type=admin`);

// 2. 连接成功
ws.onopen = () => {
  console.log('管理员WebSocket连接成功');
};

// 3. 处理消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    // 收到新通知
    console.log('新通知:', data);
  }
};
```

## 📋 核心接口速查

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/admin/notifications` | GET | 获取通知列表 |
| `/api/v1/admin/notifications/unread-count` | GET | 获取未读数量 |
| `/api/v1/admin/notifications/{id}/read` | PATCH | 标记已读 |
| `/api/v1/admin/notifications/read-all` | PATCH | 全部已读 |

## 🎯 关键字典

### 通知类型（常用）
- `user_registration_pending` - 用户注册待审核
- `company_review_pending` - 企业认证待审核  
- `product_review_pending` - 产品审核待处理
- `system_resource_warning` - 系统资源告警

### 优先级
- `CRITICAL` - 严重（红色）
- `HIGH` - 重要（橙色）
- `NORMAL` - 普通（蓝色）
- `LOW` - 一般（灰色）

### 分类
- `REVIEW` - 审核类
- `BUSINESS` - 业务类
- `SYSTEM` - 系统类
- `SECURITY` - 安全类

## 🔧 前端集成示例

### Vue3 + Element Plus
```vue
<template>
  <el-badge :value="unreadCount" class="notification-badge">
    <el-button @click="showNotifications">
      <el-icon><Bell /></el-icon>
    </el-button>
  </el-badge>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const unreadCount = ref(0)
const notifications = ref([])

// 获取未读数量
const fetchUnreadCount = async () => {
  const response = await fetch('/api/v1/admin/notifications/unread-count', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const result = await response.json()
  unreadCount.value = result.data.count
}

// 建立WebSocket连接
const connectWebSocket = () => {
  const token = localStorage.getItem('adminToken');
  const ws = new WebSocket(`ws://localhost:3050/notifications?token=${encodeURIComponent(token)}&type=admin`)
  
  ws.onopen = () => {
    console.log('管理员WebSocket连接成功');
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'notification') {
      // 新通知到达
      notifications.value.unshift(data)
      unreadCount.value++
      // 显示通知
      ElNotification({
        title: data.title,
        message: data.content,
        type: getPriorityType(data.priority)
      })
    } else if (data.type === 'unread_count_update') {
      unreadCount.value = data.count
    }
  }
}

const getPriorityType = (priority) => {
  const typeMap = {
    'CRITICAL': 'error',
    'HIGH': 'warning', 
    'NORMAL': 'info',
    'LOW': 'info'
  }
  return typeMap[priority] || 'info'
}

onMounted(() => {
  fetchUnreadCount()
  connectWebSocket()
})
</script>
```

## ⚡ 测试工具

**快速测试脚本：**
```bash
# 运行完整测试
./test/test-admin-notifications.sh

# WebSocket测试页面
open ./test/websocket-test.html
```

## 📞 获取帮助

- 详细文档：`docs/notifications/admin-notification-api-guide.md`
- 测试工具：`test/` 目录
- 技术支持：后端开发团队