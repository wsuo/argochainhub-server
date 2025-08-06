#!/bin/bash

# 管理员WebSocket连接和权限验证测试脚本

echo "🚀 开始管理员通知系统测试"
echo "=================================="

# 设置测试环境变量
BASE_URL="http://localhost:3050"

echo "🔐 步骤1: 管理员登录获取Token"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Admin123!"
  }')

echo "登录响应: $LOGIN_RESPONSE"

# 提取token
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo "❌ 无法获取有效的管理员Token，请检查登录信息"
    echo "登录响应: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ 成功获取Token: ${ADMIN_TOKEN:0:50}..."
echo ""

echo "📡 测试1: 获取管理员通知列表"
curl -s -X GET "$BASE_URL/api/v1/admin/notifications" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📊 测试2: 获取未读通知数量"
curl -s -X GET "$BASE_URL/api/v1/admin/notifications/unread-count" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📈 测试3: 获取系统指标"
curl -s -X GET "$BASE_URL/api/v1/admin/system-monitor/metrics" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n🔥 测试4: 手动触发系统健康检查"
curl -s -X POST "$BASE_URL/api/v1/admin/system-monitor/health-check" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📢 测试5: 发送广播通知"
curl -s -X POST "$BASE_URL/api/v1/admin/notifications/broadcast" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SYSTEM_MAINTENANCE",
    "title": "系统维护通知",
    "content": "系统将在今晚23:00进行例行维护，预计维护时间1小时。",
    "priority": "HIGH",
    "category": "SYSTEM"
  }' | jq '.'

echo -e "\n🎯 测试6: 基于权限发送通知"
curl -s -X POST "$BASE_URL/api/v1/admin/notifications/by-permission" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requiredPermissions": ["COMPANY_REVIEW", "COMPANY_VIEW"],
    "type": "COMPANY_REVIEW_PENDING",
    "title": "企业审核提醒",
    "content": "有新的企业认证申请需要审核。",
    "priority": "NORMAL",
    "category": "REVIEW"
  }' | jq '.'

echo -e "\n⚠️ 测试7: 发送系统告警"
curl -s -X POST "$BASE_URL/api/v1/admin/notifications/system-alert" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "MEMORY_WARNING",
    "message": "系统内存使用率达到85%，请注意监控。",
    "level": "warning"
  }' | jq '.'

echo -e "\n🔍 测试8: 获取系统状态概览"
curl -s -X GET "$BASE_URL/api/v1/admin/system-monitor/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n📜 测试9: 获取系统健康历史"
curl -s -X GET "$BASE_URL/api/v1/admin/system-monitor/health-history" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.data.dataPoints | length'

echo -e "\n🧹 测试10: 清理过期通知"
curl -s -X DELETE "$BASE_URL/api/v1/admin/notifications/cleanup-expired" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n✅ 所有HTTP API测试完成"
echo "=================================="

echo -e "\n🔌 WebSocket连接测试"
echo "请使用以下信息手动测试WebSocket连接："
echo "URL: ws://localhost:3050"
echo "有效Token: $ADMIN_TOKEN"
echo ""
echo "连接时发送认证消息："
echo '{"type": "auth", "token": "'$ADMIN_TOKEN'"}'
echo ""
echo "认证成功后，你应该能收到实时通知推送。"
echo ""
echo "🎯 测试建议："
echo "1. 打开浏览器开发者工具的WebSocket面板"
echo "2. 连接到 ws://localhost:3050"
echo "3. 发送认证消息"
echo "4. 观察是否收到实时通知推送"
echo "5. 执行上述HTTP API测试，观察WebSocket是否收到对应通知"

echo -e "\n🏁 测试脚本执行完成"