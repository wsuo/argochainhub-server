-- 创建测试用户和公司

-- 清理现有测试数据 (如果存在)
DELETE FROM users WHERE email IN ('buyer@test.com', 'supplier@test.com');
DELETE FROM companies WHERE email IN ('buyer@test.com', 'supplier@test.com');

-- 1. 插入采购商公司
INSERT INTO companies (name, type, status, email, country, profile)
VALUES (
  '{"zh": "北京采购有限公司", "en": "Beijing Buyer Co., Ltd."}',
  'buyer',
  'active',
  'buyer@test.com',
  'CN',
  '{"description": {"zh": "专业农药采购商", "en": "Professional pesticide buyer"}, "phone": "+86-10-12345678", "address": "北京市朝阳区测试街道123号"}'
);

-- 2. 插入供应商公司
INSERT INTO companies (name, type, status, email, country, profile)
VALUES (
  '{"zh": "上海农药供应商", "en": "Shanghai Pesticide Supplier"}',
  'supplier',
  'active',
  'supplier@test.com',
  'CN',
  '{"description": {"zh": "专业农药生产供应商", "en": "Professional pesticide supplier"}, "phone": "+86-21-87654321", "address": "上海市浦东新区测试路456号"}'
);

-- 3. 插入采购商用户
INSERT INTO users (email, password, name, phone, userType, companyId)
VALUES (
  'buyer@test.com',
  '$2a$10$8K1p/a0dUrZWMx1Z4JPCOOxQT4WKvQs8PNJ2fhTSV2uVtfT8QTnGC',
  '采购经理张三',
  '+86-138-1234-5678',
  'individual_buyer',
  (SELECT id FROM companies WHERE email = 'buyer@test.com')
);

-- 4. 插入供应商用户
INSERT INTO users (email, password, name, phone, userType, companyId)
VALUES (
  'supplier@test.com',
  '$2a$10$8K1p/a0dUrZWMx1Z4JPCOOxQT4WKvQs8PNJ2fhTSV2uVtfT8QTnGC',
  '销售经理李四',
  '+86-139-8765-4321',
  'supplier',
  (SELECT id FROM companies WHERE email = 'supplier@test.com')
);

-- 显示创建结果
SELECT '用户和公司创建完成' AS status;
SELECT id, name, email, type, status FROM companies WHERE email IN ('buyer@test.com', 'supplier@test.com');
SELECT id, name, email, userType FROM users WHERE email IN ('buyer@test.com', 'supplier@test.com');