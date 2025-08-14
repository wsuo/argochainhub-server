#!/bin/bash

# 供应商功能综合测试脚本
# 测试内容：搜索供应商、收藏功能、查看详情、查看产品

set -e

echo "🧪 开始供应商功能综合测试"

# 配置
BASE_URL="http://localhost:3050/api/v1"

# 获取采购商Token
echo "🔑 获取采购商Token..."
BUYER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"testpass123"}')

BUYER_TOKEN=$(echo $BUYER_LOGIN_RESPONSE | jq -r '.data.accessToken // .data.token // .token // empty')

if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" = "null" ]; then
  echo "❌ 获取采购商Token失败"
  echo "响应: $BUYER_LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 采购商Token获取成功"

# ================================
# 1. 测试供应商搜索功能
# ================================
echo ""
echo "📋 1. 测试供应商搜索功能"

# 1.1 基础搜索
echo "  1.1 基础搜索（无参数）"
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "基础搜索响应:"
echo $SEARCH_RESPONSE | jq '.'

# 1.2 关键词搜索
echo ""
echo "  1.2 关键词搜索"
KEYWORD_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?search=农业&page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "关键词搜索响应:"
echo $KEYWORD_SEARCH_RESPONSE | jq '.'

# 1.3 国家筛选
echo ""
echo "  1.3 国家筛选"
COUNTRY_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?country=CN&page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "国家筛选响应:"
echo $COUNTRY_SEARCH_RESPONSE | jq '.'

# 1.4 企业规模筛选
echo ""
echo "  1.4 企业规模筛选"
SIZE_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?companySize=medium&page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "企业规模筛选响应:"
echo $SIZE_SEARCH_RESPONSE | jq '.'

# 1.5 按产品数量排序
echo ""
echo "  1.5 按产品数量排序"
SORT_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?sortBy=productCount&sortOrder=DESC&page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "按产品数量排序响应:"
echo $SORT_SEARCH_RESPONSE | jq '.'

# 1.6 Top100供应商筛选
echo ""
echo "  1.6 Top100供应商筛选"
TOP100_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers?isTop100=true&page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "Top100供应商筛选响应:"
echo $TOP100_SEARCH_RESPONSE | jq '.'

# 从搜索结果中获取第一个供应商ID用于后续测试
SUPPLIER_ID=$(echo $SEARCH_RESPONSE | jq -r '.data[0].id // empty')

if [ -z "$SUPPLIER_ID" ] || [ "$SUPPLIER_ID" = "null" ]; then
  echo "❌ 无法获取供应商ID，跳过后续测试"
  exit 1
fi

echo "✅ 获取到测试供应商ID: $SUPPLIER_ID"

# ================================
# 2. 测试供应商详情查看
# ================================
echo ""
echo "📋 2. 测试供应商详情查看"

DETAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers/$SUPPLIER_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "供应商详情响应:"
echo $DETAIL_RESPONSE | jq '.'

# ================================
# 3. 测试供应商收藏功能
# ================================
echo ""
echo "📋 3. 测试供应商收藏功能"

# 3.1 检查收藏状态（未收藏）
echo "  3.1 检查收藏状态（预期：未收藏）"
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers/favorites/$SUPPLIER_ID/status" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "收藏状态响应:"
echo $STATUS_RESPONSE | jq '.'

# 3.2 添加收藏
echo ""
echo "  3.2 添加收藏"
ADD_FAVORITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/suppliers/favorites" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"supplierId\":$SUPPLIER_ID,\"note\":\"测试收藏供应商\"}")

echo "添加收藏响应:"
echo $ADD_FAVORITE_RESPONSE | jq '.'

# 3.3 再次检查收藏状态（已收藏）
echo ""
echo "  3.3 检查收藏状态（预期：已收藏）"
STATUS_RESPONSE_2=$(curl -s -X GET "$BASE_URL/companies/suppliers/favorites/$SUPPLIER_ID/status" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "收藏状态响应:"
echo $STATUS_RESPONSE_2 | jq '.'

# 3.4 获取收藏列表
echo ""
echo "  3.4 获取收藏列表"
FAVORITES_LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers/favorites/list" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "收藏列表响应:"
echo $FAVORITES_LIST_RESPONSE | jq '.'

# 3.5 更新收藏备注
echo ""
echo "  3.5 更新收藏备注"
UPDATE_FAVORITE_RESPONSE=$(curl -s -X PUT "$BASE_URL/companies/suppliers/favorites/$SUPPLIER_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"更新后的收藏备注 - 优质供应商"}')

echo "更新收藏响应:"
echo $UPDATE_FAVORITE_RESPONSE | jq '.'

# 3.6 取消收藏
echo ""
echo "  3.6 取消收藏"
REMOVE_FAVORITE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/companies/suppliers/favorites/$SUPPLIER_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "取消收藏响应:"
echo $REMOVE_FAVORITE_RESPONSE | jq '.'

# 3.7 最终检查收藏状态（未收藏）
echo ""
echo "  3.7 检查收藏状态（预期：未收藏）"
STATUS_RESPONSE_3=$(curl -s -X GET "$BASE_URL/companies/suppliers/favorites/$SUPPLIER_ID/status" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "收藏状态响应:"
echo $STATUS_RESPONSE_3 | jq '.'

# ================================
# 4. 测试供应商产品查看
# ================================
echo ""
echo "📋 4. 测试供应商产品查看"

PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products?supplierId=$SUPPLIER_ID&page=1&limit=10" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "供应商产品响应:"
echo $PRODUCTS_RESPONSE | jq '.'

# ================================
# 5. 测试供应商轻量级查找接口
# ================================
echo ""
echo "📋 5. 测试供应商轻量级查找接口"

# 5.1 无搜索参数
echo "  5.1 无搜索参数的查找"
LOOKUP_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers/lookup?page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "轻量级查找响应:"
echo $LOOKUP_RESPONSE | jq '.'

# 5.2 带搜索参数
echo ""
echo "  5.2 带搜索参数的查找"
LOOKUP_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/suppliers/lookup?search=农&page=1&limit=5" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "带搜索的轻量级查找响应:"
echo $LOOKUP_SEARCH_RESPONSE | jq '.'

# ================================
# 6. 错误场景测试
# ================================
echo ""
echo "📋 6. 错误场景测试"

# 6.1 收藏不存在的供应商
echo "  6.1 收藏不存在的供应商（预期：404错误）"
ERROR_FAVORITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/suppliers/favorites" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"supplierId":99999,"note":"不存在的供应商"}')

echo "收藏不存在供应商响应:"
echo $ERROR_FAVORITE_RESPONSE | jq '.'

# 6.2 重复收藏同一供应商
echo ""
echo "  6.2 重复收藏同一供应商"
# 先收藏
curl -s -X POST "$BASE_URL/companies/suppliers/favorites" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"supplierId\":$SUPPLIER_ID,\"note\":\"第一次收藏\"}" > /dev/null

# 再次收藏（预期：409冲突错误）
DUPLICATE_FAVORITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/suppliers/favorites" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"supplierId\":$SUPPLIER_ID,\"note\":\"重复收藏\"}")

echo "重复收藏响应:"
echo $DUPLICATE_FAVORITE_RESPONSE | jq '.'

# 清理：取消收藏
curl -s -X DELETE "$BASE_URL/companies/suppliers/favorites/$SUPPLIER_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN" > /dev/null

echo ""
echo "🎉 供应商功能综合测试完成！"
echo ""
echo "📊 测试覆盖范围："
echo "  ✅ 供应商搜索（基础、关键词、国家、规模、Top100筛选、排序）"
echo "  ✅ 供应商详情查看"
echo "  ✅ 供应商收藏功能（添加、查看、更新、取消）"
echo "  ✅ 收藏状态检查"
echo "  ✅ 供应商产品查看"
echo "  ✅ 轻量级供应商查找"
echo "  ✅ 错误场景处理"