# 前端开发 - 管理员通知筛选功能使用指南

## 问题说明

当前前端只显示了大类（如 "system"），但没有显示具体的小类（如 "system_maintenance"）。为了支持完整的筛选功能，我们提供了树状结构接口来实现大类联动小类的筛选。

## 新增接口

### 获取筛选树状结构
```
GET /api/v1/admin/notifications/filter-tree
```

**请求头：**
```
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取筛选树状结构成功",
  "data": [
    {
      "label": "审核类",
      "value": "review",
      "children": [
        {"label": "用户注册待审核", "value": "user_registration_pending"},
        {"label": "企业认证待审核", "value": "company_review_pending"}
      ]
    },
    {
      "label": "系统类", 
      "value": "system",
      "children": [
        {"label": "系统维护通知", "value": "system_maintenance"},
        {"label": "API错误率过高", "value": "api_error_rate_high"},
        {"label": "数据库连接异常", "value": "database_connection_error"}
      ]
    }
  ]
}
```

## 前端实现方案

### 1. 获取筛选数据

```javascript
// 获取筛选树数据
const [filterTree, setFilterTree] = useState([]);

useEffect(() => {
  const fetchFilterTree = async () => {
    try {
      const response = await fetch('/api/v1/admin/notifications/filter-tree', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setFilterTree(result.data);
      }
    } catch (error) {
      console.error('获取筛选树失败:', error);
    }
  };
  
  fetchFilterTree();
}, []);
```

### 2. 筛选组件实现（React + Ant Design）

```jsx
import { Select, Space } from 'antd';

function NotificationFilter({ onFilterChange }) {
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedType, setSelectedType] = useState();
  const [typeOptions, setTypeOptions] = useState([]);

  // 大类选择变化
  const handleCategoryChange = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setSelectedType(undefined); // 清空小类选择
    
    // 更新小类选项
    const category = filterTree.find(item => item.value === categoryValue);
    setTypeOptions(category ? category.children : []);
    
    // 触发筛选
    onFilterChange({ category: categoryValue, type: undefined });
  };

  // 小类选择变化
  const handleTypeChange = (typeValue) => {
    setSelectedType(typeValue);
    onFilterChange({ category: selectedCategory, type: typeValue });
  };

  return (
    <Space>
      {/* 大类筛选 */}
      <Select
        placeholder="选择通知大类"
        style={{ width: 150 }}
        value={selectedCategory}
        onChange={handleCategoryChange}
        allowClear
      >
        {filterTree.map(category => (
          <Select.Option key={category.value} value={category.value}>
            {category.label}
          </Select.Option>
        ))}
      </Select>

      {/* 小类筛选 */}
      <Select
        placeholder="选择具体类型"
        style={{ width: 180 }}
        value={selectedType}
        onChange={handleTypeChange}
        disabled={!selectedCategory}
        allowClear
      >
        {typeOptions.map(type => (
          <Select.Option key={type.value} value={type.value}>
            {type.label}
          </Select.Option>
        ))}
      </Select>
    </Space>
  );
}
```

### 3. 级联筛选逻辑

```javascript
// 筛选处理函数
const handleFilterChange = (filters) => {
  const params = new URLSearchParams();
  
  // 如果选择了具体类型，使用 type 参数
  if (filters.type) {
    params.append('type', filters.type);
  }
  // 否则使用 category 参数
  else if (filters.category) {
    params.append('category', filters.category);
  }
  
  // 重新请求通知列表
  fetchNotifications(params.toString());
};
```

### 4. Vue.js 实现版本

```vue
<template>
  <div class="filter-container">
    <!-- 大类筛选 -->
    <el-select 
      v-model="selectedCategory" 
      placeholder="选择通知大类"
      @change="handleCategoryChange"
      clearable
    >
      <el-option
        v-for="category in filterTree"
        :key="category.value"
        :label="category.label"
        :value="category.value"
      />
    </el-select>

    <!-- 小类筛选 -->
    <el-select 
      v-model="selectedType" 
      placeholder="选择具体类型"
      :disabled="!selectedCategory"
      @change="handleTypeChange"
      clearable
    >
      <el-option
        v-for="type in typeOptions"
        :key="type.value"
        :label="type.label"
        :value="type.value"
      />
    </el-select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      filterTree: [],
      selectedCategory: '',
      selectedType: '',
      typeOptions: []
    };
  },
  
  async mounted() {
    await this.fetchFilterTree();
  },
  
  methods: {
    async fetchFilterTree() {
      const response = await this.$http.get('/api/v1/admin/notifications/filter-tree');
      this.filterTree = response.data.data;
    },
    
    handleCategoryChange(categoryValue) {
      this.selectedType = ''; // 清空小类
      
      const category = this.filterTree.find(item => item.value === categoryValue);
      this.typeOptions = category ? category.children : [];
      
      this.$emit('filter-change', { 
        category: categoryValue, 
        type: undefined 
      });
    },
    
    handleTypeChange(typeValue) {
      this.$emit('filter-change', { 
        category: this.selectedCategory, 
        type: typeValue 
      });
    }
  }
};
</script>
```

## 使用说明

### 筛选参数使用

1. **只选择大类**：使用 `category` 参数
   ```
   GET /api/v1/admin/notifications?category=system
   ```

2. **选择具体类型**：使用 `type` 参数（会覆盖 category）
   ```
   GET /api/v1/admin/notifications?type=system_maintenance
   ```

### 数据映射关系

- **大类值**：对应 `AdminNotificationCategory` 枚举
  - `review` - 审核类
  - `business` - 业务类  
  - `operation` - 运营类
  - `system` - 系统类
  - `security` - 安全类

- **小类值**：对应 `AdminNotificationType` 枚举
  - `system_maintenance` - 系统维护通知
  - `user_registration_pending` - 用户注册待审核
  - 等等...

## 显示效果

实现后，用户可以：

1. **选择大类**：显示该大类下所有通知
   - 选择"系统类" → 显示所有系统相关通知

2. **选择具体类型**：精确筛选
   - 选择"系统维护通知" → 只显示系统维护相关通知

3. **级联联动**：大类选择后，小类选项自动更新

这样就能完整展示通知的分类层次，提升用户筛选体验！