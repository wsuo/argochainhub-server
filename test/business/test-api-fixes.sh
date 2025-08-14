#!/bin/bash

# 测试接口修复情况
# 1. 收藏列表路由修复
# 2. isTop100参数支持

set -e

echo "🧪 测试接口修复情况"

BASE_URL="http://localhost:3050/api/v1"

# 获取Token
echo "🔑 获取Token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"testpass123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // .data.token // .token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ 获取Token失败"
  exit 1
fi

echo "✅ Token获取成功"

# 测试1: 收藏列表接口
echo ""
echo "📋 测试1: 收藏列表接口修复"
FAVORITES_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers/favorites/list?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN")

FAVORITES_SUCCESS=$(echo $FAVORITES_RESPONSE | jq -r '.success // false')
if [ "$FAVORITES_SUCCESS" = "true" ]; then
  echo "✅ 收藏列表接口正常"
else
  echo "❌ 收藏列表接口异常:"
  echo $FAVORITES_RESPONSE | jq '.'
fi

# 测试2: isTop100参数支持
echo ""
echo "📋 测试2: isTop100参数支持"
TOP100_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?isTop100=true&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

TOP100_SUCCESS=$(echo $TOP100_RESPONSE | jq -r '.success // false')
if [ "$TOP100_SUCCESS" = "true" ]; then
  TOP100_COUNT=$(echo $TOP100_RESPONSE | jq '.data | length')
  echo "✅ isTop100=true参数正常，返回 $TOP100_COUNT 个Top100供应商"
else
  echo "❌ isTop100参数异常:"
  echo $TOP100_RESPONSE | jq '.'
fi

# 测试3: isTop100=false参数
echo ""
echo "📋 测试3: isTop100=false参数"
NON_TOP100_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?isTop100=false&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

NON_TOP100_SUCCESS=$(echo $NON_TOP100_RESPONSE | jq -r '.success // false')
if [ "$NON_TOP100_SUCCESS" = "true" ]; then
  NON_TOP100_COUNT=$(echo $NON_TOP100_RESPONSE | jq '.data | length')
  echo "✅ isTop100=false参数正常，返回 $NON_TOP100_COUNT 个非Top100供应商"
else
  echo "❌ isTop100=false参数异常:"
  echo $NON_TOP100_RESPONSE | jq '.'
fi

echo ""
echo "🎉 接口修复测试完成！"