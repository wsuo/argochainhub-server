-- 创建询价管理测试数据

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
INSERT INTO users (email, password, name, phone, type, company_id, created_at, updated_at)
VALUES (
  'buyer@test.com',
  '$2a$10$8K1p/a0dUrZWMx1Z4JPCOOxQT4WKvQs8PNJ2fhTSV2uVtfT8QTnGC', -- Test123!
  '采购经理张三',
  '+86-138-1234-5678',
  'individual_buyer',
  (SELECT id FROM companies WHERE email = 'buyer@test.com'),
  NOW(),
  NOW()
);

-- 4. 插入供应商用户
INSERT INTO users (email, password, name, phone, type, company_id, created_at, updated_at)
VALUES (
  'supplier@test.com',
  '$2a$10$8K1p/a0dUrZWMx1Z4JPCOOxQT4WKvQs8PNJ2fhTSV2uVtfT8QTnGC', -- Test123!
  '销售经理李四',
  '+86-139-8765-4321',
  'supplier',
  (SELECT id FROM companies WHERE email = 'supplier@test.com'),
  NOW(),
  NOW()
);

-- 5. 插入测试产品
INSERT INTO products (name, pesticide_name, formulation, active_ingredient_1, total_content, status, supplier_id, created_at, updated_at)
VALUES (
  '{"zh": "草甘膦原药", "en": "Glyphosate Technical"}',
  '{"zh": "草甘膦", "en": "Glyphosate"}',
  'TC',
  '{"name": {"zh": "草甘膦", "en": "Glyphosate"}, "content": "95%"}',
  '95%',
  'active',
  (SELECT id FROM companies WHERE email = 'supplier@test.com'),
  NOW(),
  NOW()
);

INSERT INTO products (name, pesticide_name, formulation, active_ingredient_1, total_content, status, supplier_id, created_at, updated_at)
VALUES (
  '{"zh": "阿维菌素乳油", "en": "Abamectin EC"}',
  '{"zh": "阿维菌素", "en": "Abamectin"}',
  'EC',
  '{"name": {"zh": "阿维菌素", "en": "Abamectin"}, "content": "1.8%"}',
  '1.8%',
  'active',
  (SELECT id FROM companies WHERE email = 'supplier@test.com'),
  NOW(),
  NOW()
);

-- 6. 插入询价单1 - PENDING_QUOTE状态
SET @inquiry_no_1 = CONCAT('INQ', UNIX_TIMESTAMP(NOW()), '001');
INSERT INTO inquiries (inquiry_no, buyer_id, supplier_id, status, details, deadline, created_at, updated_at)
VALUES (
  @inquiry_no_1,
  (SELECT id FROM companies WHERE email = 'buyer@test.com'),
  (SELECT id FROM companies WHERE email = 'supplier@test.com'),
  'pending_quote',
  '{"deliveryLocation": "北京市朝阳区仓库", "tradeTerms": "CIF", "paymentMethod": "T/T 30天", "buyerRemarks": "需要提供COA证书，包装要求密封防潮"}',
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  NOW(),
  NOW()
);

-- 为询价单1添加产品明细
INSERT INTO inquiry_items (inquiry_id, product_id, quantity, unit, packaging_req, product_snapshot, created_at, updated_at)
VALUES (
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_1),
  (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '草甘膦原药'),
  1000,
  'kg',
  '25kg/袋，托盘包装',
  '{"name": {"zh": "草甘膦原药", "en": "Glyphosate Technical"}, "pesticideName": {"zh": "草甘膦", "en": "Glyphosate"}, "formulation": "TC", "activeIngredient1": {"name": {"zh": "草甘膦", "en": "Glyphosate"}, "content": "95%"}, "totalContent": "95%"}',
  NOW(),
  NOW()
);

-- 为询价单1添加初始消息
INSERT INTO communications (related_service, related_id, message, sender_id, created_at, updated_at)
VALUES (
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_1),
  '您好，我们需要采购1000kg草甘膦原药，请提供报价和交期。谢谢！',
  (SELECT id FROM users WHERE email = 'buyer@test.com'),
  NOW(),
  NOW()
);

-- 7. 插入询价单2 - QUOTED状态
SET @inquiry_no_2 = CONCAT('INQ', UNIX_TIMESTAMP(NOW()), '002');
INSERT INTO inquiries (inquiry_no, buyer_id, supplier_id, status, details, quote_details, deadline, created_at, updated_at)
VALUES (
  @inquiry_no_2,
  (SELECT id FROM companies WHERE email = 'buyer@test.com'),
  (SELECT id FROM companies WHERE email = 'supplier@test.com'),
  'quoted',
  '{"deliveryLocation": "北京市朝阳区仓库", "tradeTerms": "FOB", "paymentMethod": "L/C at sight", "buyerRemarks": "需要急货，希望15天内发货"}',
  '{"totalPrice": 18000, "validUntil": "2025-01-21T00:00:00.000Z", "supplierRemarks": "价格含包装费，可15天内发货"}',
  DATE_ADD(NOW(), INTERVAL 20 DAY),
  NOW(),
  NOW()
);

-- 为询价单2添加产品明细
INSERT INTO inquiry_items (inquiry_id, product_id, quantity, unit, packaging_req, product_snapshot, created_at, updated_at)
VALUES (
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_2),
  (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '阿维菌素乳油'),
  10000,
  'L',
  '200L/桶',
  '{"name": {"zh": "阿维菌素乳油", "en": "Abamectin EC"}, "pesticideName": {"zh": "阿维菌素", "en": "Abamectin"}, "formulation": "EC", "activeIngredient1": {"name": {"zh": "阿维菌素", "en": "Abamectin"}, "content": "1.8%"}, "totalContent": "1.8%"}',
  NOW(),
  NOW()
);

-- 为询价单2添加消息记录
INSERT INTO communications (related_service, related_id, message, sender_id, created_at, updated_at)
VALUES 
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_2),
  '我需要10000L阿维菌素乳油，请报价。需要急货，15天内能发货吗？',
  (SELECT id FROM users WHERE email = 'buyer@test.com'),
  NOW(),
  NOW()
),
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_2),
  '您好，我们可以15天内发货。10000L阿维菌素乳油报价18000美元，包装费已含。有效期15天。',
  (SELECT id FROM users WHERE email = 'supplier@test.com'),
  DATE_ADD(NOW(), INTERVAL 2 MINUTE),
  DATE_ADD(NOW(), INTERVAL 2 MINUTE)
),
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_2),
  '价格可以接受，请问支持信用证付款吗？需要提供哪些证书？',
  (SELECT id FROM users WHERE email = 'buyer@test.com'),
  DATE_ADD(NOW(), INTERVAL 4 MINUTE),
  DATE_ADD(NOW(), INTERVAL 4 MINUTE)
);

-- 8. 插入询价单3 - CONFIRMED状态
SET @inquiry_no_3 = CONCAT('INQ', UNIX_TIMESTAMP(NOW()), '003');
INSERT INTO inquiries (inquiry_no, buyer_id, supplier_id, status, details, quote_details, deadline, created_at, updated_at)
VALUES (
  @inquiry_no_3,
  (SELECT id FROM companies WHERE email = 'buyer@test.com'),
  (SELECT id FROM companies WHERE email = 'supplier@test.com'),
  'confirmed',
  '{"deliveryLocation": "天津港", "tradeTerms": "CIF", "paymentMethod": "T/T 30天", "buyerRemarks": "第二次合作，质量很满意"}',
  '{"totalPrice": 95000, "validUntil": "2025-01-16T00:00:00.000Z", "supplierRemarks": "老客户价格，质量保证"}',
  DATE_ADD(NOW(), INTERVAL 25 DAY),
  NOW(),
  NOW()
);

-- 为询价单3添加产品明细
INSERT INTO inquiry_items (inquiry_id, product_id, quantity, unit, packaging_req, product_snapshot, created_at, updated_at)
VALUES (
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_3),
  (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '草甘膦原药'),
  1000,
  'kg',
  '25kg/袋，木托盘',
  '{"name": {"zh": "草甘膦原药", "en": "Glyphosate Technical"}, "pesticideName": {"zh": "草甘膦", "en": "Glyphosate"}, "formulation": "TC", "activeIngredient1": {"name": {"zh": "草甘膦", "en": "Glyphosate"}, "content": "95%"}, "totalContent": "95%"}',
  NOW(),
  NOW()
);

-- 为询价单3添加完整的消息记录
INSERT INTO communications (related_service, related_id, message, sender_id, created_at, updated_at)
VALUES 
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_3),
  '您好，我们想再次采购1000kg草甘膦原药，上次合作很愉快。',
  (SELECT id FROM users WHERE email = 'buyer@test.com'),
  NOW(),
  NOW()
),
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_3),
  '谢谢信任！老客户价格95000美元，包装按您的要求25kg/袋，木托盘。',
  (SELECT id FROM users WHERE email = 'supplier@test.com'),
  DATE_ADD(NOW(), INTERVAL 2 MINUTE),
  DATE_ADD(NOW(), INTERVAL 2 MINUTE)
),
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_3),
  '好的，价格没问题。什么时候能发货？',
  (SELECT id FROM users WHERE email = 'buyer@test.com'),
  DATE_ADD(NOW(), INTERVAL 4 MINUTE),
  DATE_ADD(NOW(), INTERVAL 4 MINUTE)
),
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_3),
  '收到定金后3-5个工作日发货，我们马上准备合同。',
  (SELECT id FROM users WHERE email = 'supplier@test.com'),
  DATE_ADD(NOW(), INTERVAL 6 MINUTE),
  DATE_ADD(NOW(), INTERVAL 6 MINUTE)
),
(
  'inquiry',
  (SELECT id FROM inquiries WHERE inquiry_no = @inquiry_no_3),
  '好的，我确认这个订单，请发合同给我。',
  (SELECT id FROM users WHERE email = 'buyer@test.com'),
  DATE_ADD(NOW(), INTERVAL 8 MINUTE),
  DATE_ADD(NOW(), INTERVAL 8 MINUTE)
);

-- 显示创建的测试数据汇总
SELECT 
  '测试数据创建完成' AS status,
  '采购商账号: buyer@test.com' AS buyer_account,
  '供应商账号: supplier@test.com' AS supplier_account,
  '密码: Test123!' AS password,
  CONCAT('询价单总数: ', COUNT(*)) AS inquiry_count
FROM inquiries 
WHERE buyer_id IN (SELECT id FROM companies WHERE email IN ('buyer@test.com', 'supplier@test.com'));