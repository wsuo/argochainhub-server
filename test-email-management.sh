#!/bin/bash

# 邮件管理功能测试脚本

BASE_URL="http://localhost:3050/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoic3VwZXJhZG1pbiIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc1MzUwODQ2MiwiZXhwIjoxNzU0MTEzMjYyfQ.H1hL94u3QFSTeV5ko2ixbcUF9OxC8TngQTIAze_60IA"

echo "=== 邮件管理功能测试 ==="
echo ""

# 1. 创建邮件配置
echo "1. 创建邮件配置"
curl -X POST "$BASE_URL/admin/email-configs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试邮件服务器",
    "host": "smtp.qq.com",
    "port": 465,
    "secure": true,
    "authUser": "test@qq.com",
    "authPass": "test-password",
    "fromEmail": "test@qq.com",
    "fromName": "ArgoChainHub测试",
    "isDefault": true,
    "maxRetries": 3,
    "retryDelay": 60
  }' | jq '.'

echo -e "\n"

# 2. 获取邮件配置列表
echo "2. 获取邮件配置列表"
curl -X GET "$BASE_URL/admin/email-configs?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n"

# 3. 创建邮件模板
echo "3. 创建邮件模板"
curl -X POST "$BASE_URL/admin/email-templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "inquiry_notification",
    "name": {
      "zh-CN": "询价通知",
      "en": "Inquiry Notification",
      "es": "Notificación de Consulta"
    },
    "description": {
      "zh-CN": "当收到新询价时发送给供应商",
      "en": "Sent to supplier when receiving new inquiry",
      "es": "Enviado al proveedor al recibir nueva consulta"
    },
    "subject": {
      "zh-CN": "新询价通知 - {{inquiryNumber}}",
      "en": "New Inquiry Notification - {{inquiryNumber}}",
      "es": "Nueva Notificación de Consulta - {{inquiryNumber}}"
    },
    "body": {
      "zh-CN": "<h2>您有新的询价</h2><p>询价编号: {{inquiryNumber}}</p><p>采购商: {{buyerName}}</p><p>产品: {{productName}}</p><p>数量: {{quantity}}</p>",
      "en": "<h2>You have a new inquiry</h2><p>Inquiry No: {{inquiryNumber}}</p><p>Buyer: {{buyerName}}</p><p>Product: {{productName}}</p><p>Quantity: {{quantity}}</p>",
      "es": "<h2>Tiene una nueva consulta</h2><p>No. de consulta: {{inquiryNumber}}</p><p>Comprador: {{buyerName}}</p><p>Producto: {{productName}}</p><p>Cantidad: {{quantity}}</p>"
    },
    "variables": [
      {
        "name": "inquiryNumber",
        "description": "询价编号",
        "example": "INQ-2025-0001"
      },
      {
        "name": "buyerName",
        "description": "采购商名称",
        "example": "ABC公司"
      },
      {
        "name": "productName",
        "description": "产品名称",
        "example": "农药产品A"
      },
      {
        "name": "quantity",
        "description": "采购数量",
        "example": "1000吨"
      }
    ],
    "triggerEvent": "inquiry.created"
  }' | jq '.'

echo -e "\n"

# 4. 获取邮件模板列表
echo "4. 获取邮件模板列表"
curl -X GET "$BASE_URL/admin/email-templates?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n"

# 5. 获取触发事件列表
echo "5. 获取触发事件列表"
curl -X GET "$BASE_URL/admin/email-templates/trigger-events" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n"

# 6. 预览邮件模板（假设模板ID为1）
echo "6. 预览邮件模板"
curl -X POST "$BASE_URL/admin/email-templates/1/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "inquiryNumber": "INQ-2025-0001",
      "buyerName": "测试公司",
      "productName": "测试产品",
      "quantity": "100吨"
    },
    "language": "zh-CN"
  }' | jq '.'

echo -e "\n"

# 7. 发送测试邮件
echo "7. 发送测试邮件"
curl -X POST "$BASE_URL/admin/email-histories/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "toName": "测试用户",
    "subject": "测试邮件",
    "body": "<h1>这是一封测试邮件</h1><p>测试邮件管理功能</p>",
    "language": "zh-CN"
  }' | jq '.'

echo -e "\n"

# 8. 获取邮件发送历史
echo "8. 获取邮件发送历史"
curl -X GET "$BASE_URL/admin/email-histories?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n"

# 9. 获取邮件统计信息
echo "9. 获取邮件统计信息"
curl -X GET "$BASE_URL/admin/email-histories/statistics?days=7" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n"

echo "=== 测试完成 ==="