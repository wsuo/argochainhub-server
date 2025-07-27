#!/bin/bash

# VIP配置管理接口测试脚本

BASE_URL="http://localhost:3010/api/v1/admin/vip-configs"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc1MzUwODQ2MiwiZXhwIjoxNzU0MTEzMjYyfQ.H1hL94u3QFSTeV5ko2ixbcUF9OxC8TngQTIAze_60IA"

echo "=========================================="
echo "测试VIP配置管理接口"
echo "=========================================="

# 1. 创建VIP配置 - 供应商基础版
echo -e "\n1. 创建VIP配置 - 供应商基础版"
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "zh-CN": "供应商基础版",
      "en": "Supplier Basic Edition",
      "es": "Edición Básica del Proveedor"
    },
    "platform": "supplier",
    "level": "basic",
    "currency": "USD",
    "originalPrice": 299,
    "currentPrice": 199,
    "days": 365,
    "accountQuota": 5,
    "maxPurchaseCount": 3,
    "bonusDays": 0,
    "sampleViewCount": 50,
    "vipLevelNumber": 2,
    "inquiryManagementCount": 30,
    "registrationManagementCount": 10,
    "productPublishCount": 50,
    "viewCount": 100,
    "remarkZh": "适合中小型供应商的基础方案",
    "remarkEn": "Basic plan suitable for small and medium suppliers",
    "remarkEs": "Plan básico adecuado para proveedores pequeños y medianos",
    "isActive": true,
    "sortOrder": 2
  }' | jq

# 2. 创建VIP配置 - 供应商高级版
echo -e "\n\n2. 创建VIP配置 - 供应商高级版"
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "zh-CN": "供应商高级版",
      "en": "Supplier Advanced Edition",
      "es": "Edición Avanzada del Proveedor"
    },
    "platform": "supplier",
    "level": "advanced",
    "currency": "USD",
    "originalPrice": 999,
    "currentPrice": 699,
    "days": 365,
    "accountQuota": 20,
    "maxPurchaseCount": 5,
    "bonusDays": 60,
    "sampleViewCount": 200,
    "vipLevelNumber": 3,
    "inquiryManagementCount": 100,
    "registrationManagementCount": 50,
    "productPublishCount": 200,
    "viewCount": 500,
    "remarkZh": "适合大型供应商的高级方案",
    "remarkEn": "Advanced plan suitable for large suppliers",
    "remarkEs": "Plan avanzado adecuado para grandes proveedores",
    "isActive": true,
    "sortOrder": 3
  }' | jq

# 3. 创建VIP配置 - 采购商基础版
echo -e "\n\n3. 创建VIP配置 - 采购商基础版"
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "zh-CN": "采购商基础版",
      "en": "Purchaser Basic Edition",
      "es": "Edición Básica del Comprador"
    },
    "platform": "purchaser",
    "level": "basic",
    "currency": "CNY",
    "originalPrice": 1999,
    "currentPrice": 1299,
    "days": 365,
    "accountQuota": 3,
    "maxPurchaseCount": 3,
    "bonusDays": 0,
    "sampleViewCount": 100,
    "vipLevelNumber": 2,
    "inquiryManagementCount": 50,
    "registrationManagementCount": 20,
    "productPublishCount": 0,
    "viewCount": 200,
    "remarkZh": "适合中小型采购商的基础方案",
    "remarkEn": "Basic plan suitable for small and medium purchasers",
    "remarkEs": "Plan básico adecuado para compradores pequeños y medianos",
    "isActive": true,
    "sortOrder": 2
  }' | jq

# 4. 查询所有VIP配置
echo -e "\n\n4. 查询所有VIP配置"
curl -X GET "$BASE_URL?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. 根据平台查询
echo -e "\n\n5. 根据平台查询 - 供应商平台"
curl -X GET "$BASE_URL?platform=supplier" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. 根据平台获取配置列表
echo -e "\n\n6. 根据平台获取配置列表"
curl -X GET "$BASE_URL/platform/supplier" \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. 获取统计信息
echo -e "\n\n7. 获取VIP配置统计信息"
curl -X GET "$BASE_URL/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq

# 8. 更新VIP配置（假设ID为1）
echo -e "\n\n8. 更新VIP配置"
curl -X PATCH "$BASE_URL/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPrice": 169,
    "remarkZh": "限时优惠价格"
  }' | jq

# 9. 切换状态
echo -e "\n\n9. 切换VIP配置状态"
curl -X POST "$BASE_URL/1/toggle-status" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n\n测试完成！"