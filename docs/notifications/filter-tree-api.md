# 管理员通知筛选树状结构 API

## 接口概述

为前端提供管理员通知类型的树状结构数据，支持大类联动小类的筛选功能。

## 接口地址

```
GET /api/v1/admin/notifications/filter-tree
```

## 请求参数

无需参数

## 请求头

```
Authorization: Bearer <access_token>
```

## 响应格式

### 成功响应 (200 OK)

```json
{
  "success": true,
  "message": "获取筛选树状结构成功",
  "data": [
    {
      "label": "审核类",
      "value": "review",
      "children": [
        {
          "label": "用户注册待审核",
          "value": "user_registration_pending"
        },
        {
          "label": "企业认证待审核", 
          "value": "company_review_pending"
        }
        // ... 更多审核类子项
      ]
    },
    {
      "label": "业务类",
      "value": "business", 
      "children": [
        {
          "label": "新询价单创建",
          "value": "inquiry_created"
        }
        // ... 更多业务类子项
      ]
    }
    // ... 更多分类
  ]
}
```

## 数据结构说明

### 树节点结构

每个树节点包含以下字段：

- `label` (string): 显示文本，中文名称
- `value` (string): 实际值，用于API调用
- `children` (array): 子节点数组（仅根节点有）

### 分类说明

系统按业务逻辑将通知类型分为5个大类：

1. **审核类 (review)**
   - 用户注册待审核
   - 企业认证待审核/通过/拒绝
   - 产品审核待处理/通过/拒绝
   - 样品申请待处理
   - 登记申请待处理

2. **业务类 (business)**
   - 新询价单创建
   - 订单状态变更
   - 用户投诉
   - 收到反馈
   - 业务交易成功/失败

3. **运营类 (operation)**
   - VIP会员批量到期
   - 业务指标告警
   - 订阅指标
   - 营收告警

4. **系统类 (system)**
   - API错误率过高
   - 数据库连接异常
   - 系统资源告警
   - 系统维护通知
   - 备份失败
   - 版本更新
   - 功能公告

5. **安全类 (security)**
   - 安全事件

## 前端使用示例

### 获取筛选树数据

```javascript
// 获取筛选树结构
async function getFilterTree() {
  const response = await fetch('/api/v1/admin/notifications/filter-tree', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data; // 返回树形数据
}
```

### 级联筛选实现

```javascript
// 大类选择变化时
function onCategoryChange(categoryValue) {
  const category = filterTree.find(item => item.value === categoryValue);
  const types = category ? category.children : [];
  
  // 更新小类选项
  updateTypeOptions(types);
}

// 构建筛选参数
function buildFilterParams(category, type) {
  const params = {};
  
  if (category) {
    params.category = category;
  }
  
  if (type) {
    params.type = type;
  }
  
  return params;
}
```

## 注意事项

1. 接口需要管理员认证，必须提供有效的访问令牌
2. 树形结构基于字典数据动态生成，支持多语言
3. 子节点的 `value` 值可直接用于通知列表的筛选参数
4. 根节点的 `value` 对应 `AdminNotificationCategory` 枚举
5. 子节点的 `value` 对应 `AdminNotificationType` 枚举

## 测试示例

```bash
# 获取筛选树结构
curl -X GET "http://localhost:3050/api/v1/admin/notifications/filter-tree" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```