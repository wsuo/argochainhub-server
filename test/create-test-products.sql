-- 创建产品和询价测试数据

-- 1. 插入测试产品
INSERT INTO products (name, pesticideName, formulation, activeIngredient1, totalContent, status, supplierId)
VALUES (
  '{"zh": "草甘膦原药", "en": "Glyphosate Technical"}',
  '{"zh": "草甘膦", "en": "Glyphosate"}',
  'TC',
  '{"name": {"zh": "草甘膦", "en": "Glyphosate"}, "content": "95%"}',
  '95%',
  'active',
  (SELECT id FROM companies WHERE email = 'supplier@test.com')
);

INSERT INTO products (name, pesticideName, formulation, activeIngredient1, totalContent, status, supplierId)
VALUES (
  '{"zh": "阿维菌素乳油", "en": "Abamectin EC"}',
  '{"zh": "阿维菌素", "en": "Abamectin"}',
  'EC',
  '{"name": {"zh": "阿维菌素", "en": "Abamectin"}, "content": "1.8%"}',
  '1.8%',
  'active',
  (SELECT id FROM companies WHERE email = 'supplier@test.com')
);

-- 获取产品ID以便后续使用
SET @product1_id = (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '草甘膦原药');
SET @product2_id = (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '阿维菌素乳油');
SET @buyer_company_id = (SELECT id FROM companies WHERE email = 'buyer@test.com');
SET @supplier_company_id = (SELECT id FROM companies WHERE email = 'supplier@test.com');
SET @buyer_user_id = (SELECT id FROM users WHERE email = 'buyer@test.com');
SET @supplier_user_id = (SELECT id FROM users WHERE email = 'supplier@test.com');

-- 显示创建的产品
SELECT '产品创建完成' AS status;
SELECT id, JSON_EXTRACT(name, '$.zh') as product_name, formulation, status FROM products WHERE supplierId = @supplier_company_id;