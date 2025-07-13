# 字典管理系统 API 测试文档

## 📋 系统概览

字典管理系统是智慧农化采购平台的核心配置模块，用于管理系统中所有的枚举数据，包括业务类别、企业状态、产品分类、国家列表等。系统采用分类+字典项的两级结构，支持多语言、层级关系和扩展数据。

## 🎯 核心功能

### 1. 字典分类管理
- 支持动态创建、修改、删除字典分类
- 支持多语言名称和描述
- 系统分类保护机制

### 2. 字典项管理
- 支持字典项的CRUD操作
- 支持父子级层级结构
- 支持扩展数据存储（如国家的ISO代码、电话区号等）
- 批量导入功能

### 3. 国家数据集成
- 集成 countries-list 第三方库
- 包含250个国家的标准化数据
- 中文国家名称映射
- 国旗图标支持

## 🚀 API 接口列表

### 管理员接口 (需要认证)

#### 字典分类管理

```bash
# 1. 获取字典分类列表
GET /api/v1/admin/dictionaries/categories?page=1&limit=20

# 2. 根据代码获取字典分类详情
GET /api/v1/admin/dictionaries/categories/business_type

# 3. 创建字典分类
POST /api/v1/admin/dictionaries/categories

# 4. 更新字典分类
PUT /api/v1/admin/dictionaries/categories/1

# 5. 删除字典分类
DELETE /api/v1/admin/dictionaries/categories/1
```

#### 字典项管理

```bash
# 6. 获取指定分类的字典项列表
GET /api/v1/admin/dictionaries/business_type/items?page=1&limit=20

# 7. 创建字典项
POST /api/v1/admin/dictionaries/business_type/items

# 8. 更新字典项
PUT /api/v1/admin/dictionaries/items/1

# 9. 删除字典项
DELETE /api/v1/admin/dictionaries/items/1

# 10. 批量导入字典项
POST /api/v1/admin/dictionaries/business_type/batch
```

### 前端查询接口 (无需认证)

```bash
# 11. 获取指定分类的字典项 (前端用)
GET /api/v1/dictionaries/business_type

# 12. 获取企业规模字典
GET /api/v1/dictionaries/company_size

# 13. 获取企业类型字典
GET /api/v1/dictionaries/company_type

# 14. 获取企业状态字典
GET /api/v1/dictionaries/company_status

# 15. 获取产品分类字典
GET /api/v1/dictionaries/product_category

# 16. 获取剂型类型字典
GET /api/v1/dictionaries/formulation_type

# 17. 获取包含国旗的国家列表
GET /api/v1/dictionaries/countries/with-flags
```

## 📝 详细测试案例

### 1. 获取业务类别字典 ✅

```bash
curl -X GET "http://localhost:3010/api/v1/dictionaries/business_type" \
  -H "accept: application/json"
```

**预期响应：**
```json
[
  {
    "id": "1",
    "code": "api_production",
    "name": {
      "zh-CN": "原药生产",
      "en": "API Production",
      "es": "Producción de API"
    },
    "isActive": true,
    "sortOrder": 1
  },
  {
    "id": "2",
    "code": "formulation_production",
    "name": {
      "zh-CN": "制剂生产",
      "en": "Formulation Production",
      "es": "Producción de Formulación"
    },
    "isActive": true,
    "sortOrder": 2
  }
  // ... 其他11个业务类别
]
```

### 2. 获取国家列表（含国旗）✅

```bash
curl -X GET "http://localhost:3010/api/v1/dictionaries/countries/with-flags" \
  -H "accept: application/json"
```

**预期响应：**
```json
[
  {
    "code": "cn",
    "name": {
      "zh-CN": "中国",
      "en": "China",
      "es": "China"
    },
    "flag": "🇨🇳",
    "countryCode": "+86",
    "iso2": "CN",
    "continent": "AS",
    "isActive": true
  },
  {
    "code": "us",
    "name": {
      "zh-CN": "美国",
      "en": "United States",
      "es": "United States"
    },
    "flag": "🇺🇸",
    "countryCode": "+1",
    "iso2": "US",
    "continent": "NA",
    "isActive": true
  }
  // ... 其他248个国家
]
```

### 3. 获取产品分类字典

```bash
curl -X GET "http://localhost:3010/api/v1/dictionaries/product_category" \
  -H "accept: application/json"
```

### 4. 获取剂型类型字典

```bash
curl -X GET "http://localhost:3010/api/v1/dictionaries/formulation_type" \
  -H "accept: application/json"
```

### 5. 获取企业规模字典 ✅

```bash
curl -X GET "http://localhost:3010/api/v1/dictionaries/company_size" \
  -H "accept: application/json"
```

**预期响应：**
```json
[
  {
    "id": "286",
    "code": "startup",
    "name": {
      "zh-CN": "初创企业 (1-10人)",
      "en": "Startup (1-10 employees)",
      "es": "Startup (1-10 empleados)"
    },
    "isActive": true,
    "sortOrder": 1
  },
  {
    "id": "287",
    "code": "small",
    "name": {
      "zh-CN": "小型企业 (11-50人)",
      "en": "Small Enterprise (11-50 employees)",
      "es": "Pequeña Empresa (11-50 empleados)"
    },
    "isActive": true,
    "sortOrder": 2
  },
  {
    "id": "288",
    "code": "medium",
    "name": {
      "zh-CN": "中型企业 (51-200人)",
      "en": "Medium Enterprise (51-200 employees)",
      "es": "Empresa Mediana (51-200 empleados)"
    },
    "isActive": true,
    "sortOrder": 3
  },
  {
    "id": "289",
    "code": "large",
    "name": {
      "zh-CN": "大型企业 (201-1000人)",
      "en": "Large Enterprise (201-1000 employees)",
      "es": "Gran Empresa (201-1000 empleados)"
    },
    "isActive": true,
    "sortOrder": 4
  },
  {
    "id": "290",
    "code": "enterprise",
    "name": {
      "zh-CN": "大型集团 (1000+人)",
      "en": "Enterprise Group (1000+ employees)",
      "es": "Grupo Empresarial (1000+ empleados)"
    },
    "isActive": true,
    "sortOrder": 5
  }
]
```

## 🏗️ 数据结构说明

### 字典分类 (DictionaryCategory)

```typescript
{
  id: number;                    // 自增ID
  code: string;                  // 分类代码，唯一
  name: MultiLangText;           // 多语言名称
  description?: MultiLangText;   // 多语言描述
  isSystem: boolean;             // 是否为系统分类
  isActive: boolean;             // 是否激活
  sortOrder: number;             // 排序顺序
  items: DictionaryItem[];       // 关联的字典项
}
```

### 字典项 (DictionaryItem)

```typescript
{
  id: number;                    // 自增ID
  code: string;                  // 字典项代码
  name: MultiLangText;           // 多语言名称
  description?: MultiLangText;   // 多语言描述
  extraData?: {                  // 扩展数据
    iso2?: string;               // 国家ISO2代码
    iso3?: string;               // 国家ISO3代码
    countryCode?: string;        // 电话区号
    continent?: string;          // 所属大洲
    flagIcon?: string;           // 国旗图标
    [key: string]: any;          // 其他扩展字段
  };
  isSystem: boolean;             // 是否为系统字典项
  isActive: boolean;             // 是否激活
  sortOrder: number;             // 排序顺序
  parentId?: number;             // 父级字典项ID
  categoryId: number;            // 所属分类ID
  children: DictionaryItem[];    // 子级字典项
}
```

### 多语言文本 (MultiLangText)

```typescript
{
  "zh-CN": string;  // 中文
  "en": string;     // 英文
  "es": string;     // 西班牙文
}
```

## 📊 系统数据统计

### 已初始化的字典分类

| 分类代码 | 中文名称 | 字典项数量 | 说明 |
|---------|---------|-----------|------|
| business_type | 业务类别 | 13 | 农化行业业务分类 |
| company_status | 企业状态 | 3 | 企业审核状态 |
| company_type | 企业类型 | 2 | 买家/供应商 |
| company_size | 企业规模 | 5 | 按员工数量分类 |
| product_status | 产品状态 | 5 | 产品生命周期状态 |
| formulation_type | 剂型类型 | 6 | 农药产品剂型 |
| product_category | 产品分类 | 6 | 农化产品功能分类 |
| countries | 国家地区 | 250 | 全球国家数据 |

### 业务类别详细列表

1. **原药生产** (api_production)
2. **制剂生产** (formulation_production)
3. **原药+制剂生产** (api_formulation_production)
4. **国内贸易** (domestic_trade)
5. **国际贸易** (international_trade)
6. **生产+国际贸易** (production_international_trade)
7. **货代** (freight_forwarding)
8. **物流运输** (logistics_transport)
9. **中间体** (intermediate)
10. **助剂** (adjuvant)
11. **化肥** (fertilizer)
12. **种植园** (plantation)
13. **其他** (other)

## 🔧 使用场景示例

### 前端下拉框数据获取

```javascript
// 获取业务类别选项
const businessTypes = await fetch('/api/v1/dictionaries/business_type')
  .then(res => res.json());

// 渲染下拉框
businessTypes.forEach(item => {
  const option = new Option(item.name['zh-CN'], item.code);
  selectElement.appendChild(option);
});

// 获取国家列表（含国旗）
const countries = await fetch('/api/v1/dictionaries/countries/with-flags')
  .then(res => res.json());

// 渲染国家选择器
countries.forEach(country => {
  const option = document.createElement('option');
  option.value = country.code;
  option.textContent = `${country.flag} ${country.name['zh-CN']} (${country.countryCode})`;
  countrySelect.appendChild(option);
});
```

### 后端业务逻辑验证

```typescript
// 验证业务类别是否有效
const validBusinessTypes = await dictionaryService.getDictionaryByCode('business_type');
const isValidType = validBusinessTypes.some(item => 
  item.code === userInput && item.isActive
);

// 获取国家信息
const countries = await dictionaryService.getDictionaryByCode('countries');
const countryInfo = countries.find(country => country.code === countryCode);
const countryName = countryInfo?.name['zh-CN'] || 'Unknown';
```

## ✅ 测试检查清单

- [x] 业务类别字典数据完整性（13个选项）
- [x] 国家列表数据完整性（250个国家）
- [x] 多语言支持（中英西三语）
- [x] 国旗图标正确显示
- [x] 电话区号数据准确性
- [x] 常用国家优先排序
- [x] 系统数据保护机制
- [x] 前端无需认证接口
- [x] 数据分页和筛选功能
- [x] 批量导入功能

## 🚨 注意事项

1. **系统数据保护**：系统初始化的字典分类和字典项（isSystem=true）不能删除，只能禁用
2. **代码唯一性**：同一分类下的字典项代码必须唯一
3. **层级关系**：删除字典项时必须先删除所有子项
4. **国际化支持**：所有字典项都支持多语言，建议完善各语言版本
5. **缓存策略**：前端建议对字典数据进行缓存，减少重复请求
6. **数据初始化**：首次部署时需要运行 `npx ts-node src/scripts/init-dictionaries.ts` 初始化数据

## 📈 性能优化建议

1. 前端字典数据缓存，有效期建议24小时
2. 使用Redis缓存热门字典查询结果
3. 国家列表数据可考虑CDN加速
4. 支持按需加载，避免一次性加载所有字典数据

## 🔮 未来扩展方向

1. 支持字典项的多层级嵌套（目前仅支持两级）
2. 支持字典数据的版本管理和回滚
3. 支持字典数据的导入/导出功能
4. 支持更多语言的国际化
5. 支持字典数据的使用情况统计和分析