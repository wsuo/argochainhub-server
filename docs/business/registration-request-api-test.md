# 登记管理模块接口测试文档

## 概述
本文档记录登记管理模块的所有后台管理接口及其测试结果。

测试环境：
- 服务地址：http://localhost:3010
- 数据库：argochainhub
- 测试时间：2025-01-27

## 接口列表

### 1. 获取登记申请列表
**接口地址**：`GET /api/v1/admin/registration-requests`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页条数，默认20 |
| regReqNo | string | 否 | 登记申请单号 |
| status | string | 否 | 状态：pending_response, in_progress, completed, declined, cancelled |
| buyerId | number | 否 | 买方企业ID |
| supplierId | number | 否 | 供应商企业ID |
| productId | number | 否 | 产品ID |
| targetCountry | string | 否 | 目标国家 |
| createdStartDate | string | 否 | 创建开始日期 (YYYY-MM-DD) |
| createdEndDate | string | 否 | 创建结束日期 (YYYY-MM-DD) |
| keyword | string | 否 | 关键字模糊查询（可匹配登记申请单号、买方企业名称、供应商企业名称、产品名称、目标国家） |

**请求示例**：
```bash
curl -X GET "http://localhost:3010/api/v1/admin/registration-requests?status=pending_response&limit=10" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**响应示例**：
```json
{
  "data": [
    {
      "id": "1",
      "regReqNo": "REG2025012701",
      "status": "pending_response",
      "details": {
        "targetCountry": "US",
        "isExclusive": true,
        "docReqs": ["EPA Registration", "State Registration", "Product Label", "Safety Data Sheet"],
        "sampleReq": {
          "needed": true,
          "quantity": 5,
          "unit": "kg"
        },
        "timeline": "6 months",
        "budget": {
          "amount": 50000,
          "currency": "USD"
        },
        "additionalRequirements": "需要提供美国EPA注册支持，协助准备所有必要文件"
      },
      "productSnapshot": {
        "name": "草哭哭",
        "category": "除草剂",
        "formulation": "TF",
        "activeIngredient": "111 10%",
        "content": "500ml"
      },
      "deadline": "2025-06-30",
      "buyer": {
        "id": "17",
        "name": {
          "en": "Global Agro Trading Ltd.",
          "zh-CN": "全球农贸有限公司"
        }
      },
      "supplier": {
        "id": "2",
        "name": {
          "en": "GreenField Chemical Technology Co., Ltd.",
          "zh-CN": "绿田化工科技有限公司"
        }
      },
      "product": {
        "id": "4",
        "name": {
          "en": "caokuku",
          "zh-CN": "草哭哭"
        }
      }
    }
  ],
  "meta": {
    "totalItems": 6,
    "itemCount": 2,
    "itemsPerPage": 10,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

**测试结果**：✅ 通过

### 2. 获取登记申请详情
**接口地址**：`GET /api/v1/admin/registration-requests/:id`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 登记申请ID |

**请求示例**：
```bash
curl -X GET "http://localhost:3010/api/v1/admin/registration-requests/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**响应示例**：包含完整的登记申请信息，包括买方、供应商、产品的详细信息。

**测试结果**：✅ 通过

### 3. 获取登记申请统计数据
**接口地址**：`GET /api/v1/admin/registration-requests/stats`

**请求示例**：
```bash
curl -X GET "http://localhost:3010/api/v1/admin/registration-requests/stats" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**响应示例**：
```json
{
  "pendingResponse": 2,
  "inProgress": 1,
  "completed": 1,
  "declined": 1,
  "cancelled": 1,
  "total": 6
}
```

**测试结果**：✅ 通过

### 4. 更新登记申请状态
**接口地址**：`PATCH /api/v1/admin/registration-requests/:id/status`

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 是 | 新状态 |
| statusNote | string | 否 | 状态说明或拒绝原因 |
| operatedBy | string | 是 | 操作人 |

**状态转换规则**：
- `pending_response` → `in_progress`, `declined`, `cancelled`
- `in_progress` → `completed`, `declined`, `cancelled`
- `completed` → 不可转换
- `declined` → 不可转换
- `cancelled` → 不可转换

**请求示例**：
```bash
curl -X PATCH "http://localhost:3010/api/v1/admin/registration-requests/1/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "statusNote": "已开始处理登记申请，正在准备EPA文件",
    "operatedBy": "superadmin"
  }'
```

**测试结果**：
- ✅ 合法状态转换测试通过
- ✅ 非法状态转换返回400错误

### 5. 删除登记申请
**接口地址**：`DELETE /api/v1/admin/registration-requests/:id`

**业务规则**：
- 只能删除状态为 `pending_response` 或 `cancelled` 的登记申请
- 其他状态的登记申请删除会返回400错误

**请求示例**：
```bash
curl -X DELETE "http://localhost:3010/api/v1/admin/registration-requests/5" \
  -H "Authorization: Bearer {token}"
```

**响应示例**：
```json
{
  "message": "登记申请删除成功"
}
```

**测试结果**：
- ✅ 删除已取消的登记申请成功
- ✅ 删除进行中的登记申请失败（返回400错误）

## 测试数据说明

测试过程中创建了以下测试数据：
1. **REG2025012701** - 待回复状态，美国市场登记申请
2. **REG2025012702** - 进行中状态，法国市场登记申请
3. **REG2025010301** - 已完成状态，日本市场登记申请
4. **REG2025011501** - 已拒绝状态，巴西市场登记申请
5. **REG2025012001** - 已取消状态，澳大利亚市场登记申请
6. **REG2025012703** - 待回复状态，加拿大市场登记申请

## 业务逻辑验证

1. **状态流转**：
   - 状态转换遵循预定义的规则
   - 不允许逆向流转（如从completed回到pending_response）
   - 每次状态变更都会记录历史

2. **数据完整性**：
   - 登记申请包含产品快照，即使原产品信息修改也不影响历史记录
   - 关联买方、供应商、产品信息完整

3. **查询功能**：
   - 支持多维度筛选（状态、企业、产品、国家、日期等）
   - 新增关键字模糊查询功能，支持搜索企业名称、产品名称、登记申请单号、目标国家

## 改进建议

1. 建议在登记申请实体中增加以下字段：
   - `estimatedCost` - 预估登记成本
   - `actualCost` - 实际登记成本
   - `progressPercentage` - 进度百分比
   - `assignedTo` - 负责人

2. 建议增加以下功能：
   - 批量更新状态
   - 导出Excel功能
   - 登记申请复制功能（基于已有申请创建新申请）

## 测试总结

登记管理模块的所有接口功能正常，业务逻辑合理，数据完整性得到保证。接口响应速度良好，错误处理恰当。