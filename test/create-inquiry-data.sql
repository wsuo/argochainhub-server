-- 创建询价和消息测试数据

-- 获取相关ID
SET @buyer_company_id = (SELECT id FROM companies WHERE email = 'buyer@test.com');
SET @supplier_company_id = (SELECT id FROM companies WHERE email = 'supplier@test.com');
SET @buyer_user_id = (SELECT id FROM users WHERE email = 'buyer@test.com');
SET @supplier_user_id = (SELECT id FROM users WHERE email = 'supplier@test.com');
SET @product1_id = (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '草甘膦原药');
SET @product2_id = (SELECT id FROM products WHERE JSON_EXTRACT(name, '$.zh') = '阿维菌素乳油');

-- 1. 创建询价单1 - PENDING_QUOTE状态
SET @inquiry_no_1 = CONCAT('INQ', UNIX_TIMESTAMP(), '001');
INSERT INTO inquiries (inquiryNo, buyerId, supplierId, status, details, deadline)
VALUES (
  @inquiry_no_1,
  @buyer_company_id,
  @supplier_company_id,
  'pending_quote',
  '{"deliveryLocation": "北京市朝阳区仓库", "tradeTerms": "CIF", "paymentMethod": "T/T 30天", "buyerRemarks": "需要提供COA证书，包装要求密封防潮"}',
  DATE_ADD(NOW(), INTERVAL 30 DAY)
);

SET @inquiry1_id = LAST_INSERT_ID();

-- 为询价单1添加产品明细
INSERT INTO inquiry_items (inquiryId, productId, quantity, unit, packagingReq, productSnapshot)
VALUES (
  @inquiry1_id,
  @product1_id,
  1000,
  'kg',
  '25kg/袋，托盘包装',
  '{"name": {"zh": "草甘膦原药", "en": "Glyphosate Technical"}, "pesticideName": {"zh": "草甘膦", "en": "Glyphosate"}, "formulation": "TC", "activeIngredient1": {"name": {"zh": "草甘膦", "en": "Glyphosate"}, "content": "95%"}, "totalContent": "95%"}'
);

-- 为询价单1添加初始消息
INSERT INTO communications (relatedService, relatedId, message, senderId)
VALUES (
  'inquiry',
  @inquiry1_id,
  '您好，我们需要采购1000kg草甘膦原药，请提供报价和交期。谢谢！',
  @buyer_user_id
);

-- 2. 创建询价单2 - QUOTED状态
SET @inquiry_no_2 = CONCAT('INQ', UNIX_TIMESTAMP() + 1, '002');
INSERT INTO inquiries (inquiryNo, buyerId, supplierId, status, details, quoteDetails, deadline)
VALUES (
  @inquiry_no_2,
  @buyer_company_id,
  @supplier_company_id,
  'quoted',
  '{"deliveryLocation": "北京市朝阳区仓库", "tradeTerms": "FOB", "paymentMethod": "L/C at sight", "buyerRemarks": "需要急货，希望15天内发货"}',
  '{"totalPrice": 18000, "validUntil": "2025-01-21T00:00:00.000Z", "supplierRemarks": "价格含包装费，可15天内发货"}',
  DATE_ADD(NOW(), INTERVAL 20 DAY)
);

SET @inquiry2_id = LAST_INSERT_ID();

-- 为询价单2添加产品明细
INSERT INTO inquiry_items (inquiryId, productId, quantity, unit, packagingReq, productSnapshot)
VALUES (
  @inquiry2_id,
  @product2_id,
  10000,
  'L',
  '200L/桶',
  '{"name": {"zh": "阿维菌素乳油", "en": "Abamectin EC"}, "pesticideName": {"zh": "阿维菌素", "en": "Abamectin"}, "formulation": "EC", "activeIngredient1": {"name": {"zh": "阿维菌素", "en": "Abamectin"}, "content": "1.8%"}, "totalContent": "1.8%"}'
);

-- 为询价单2添加消息记录
INSERT INTO communications (relatedService, relatedId, message, senderId) VALUES 
('inquiry', @inquiry2_id, '我需要10000L阿维菌素乳油，请报价。需要急货，15天内能发货吗？', @buyer_user_id),
('inquiry', @inquiry2_id, '您好，我们可以15天内发货。10000L阿维菌素乳油报价18000美元，包装费已含。有效期15天。', @supplier_user_id),
('inquiry', @inquiry2_id, '价格可以接受，请问支持信用证付款吗？需要提供哪些证书？', @buyer_user_id);

-- 3. 创建询价单3 - CONFIRMED状态
SET @inquiry_no_3 = CONCAT('INQ', UNIX_TIMESTAMP() + 2, '003');
INSERT INTO inquiries (inquiryNo, buyerId, supplierId, status, details, quoteDetails, deadline)
VALUES (
  @inquiry_no_3,
  @buyer_company_id,
  @supplier_company_id,
  'confirmed',
  '{"deliveryLocation": "天津港", "tradeTerms": "CIF", "paymentMethod": "T/T 30天", "buyerRemarks": "第二次合作，质量很满意"}',
  '{"totalPrice": 95000, "validUntil": "2025-01-16T00:00:00.000Z", "supplierRemarks": "老客户价格，质量保证"}',
  DATE_ADD(NOW(), INTERVAL 25 DAY)
);

SET @inquiry3_id = LAST_INSERT_ID();

-- 为询价单3添加产品明细
INSERT INTO inquiry_items (inquiryId, productId, quantity, unit, packagingReq, productSnapshot)
VALUES (
  @inquiry3_id,
  @product1_id,
  1000,
  'kg',
  '25kg/袋，木托盘',
  '{"name": {"zh": "草甘膦原药", "en": "Glyphosate Technical"}, "pesticideName": {"zh": "草甘膦", "en": "Glyphosate"}, "formulation": "TC", "activeIngredient1": {"name": {"zh": "草甘膦", "en": "Glyphosate"}, "content": "95%"}, "totalContent": "95%"}'
);

-- 为询价单3添加完整的消息记录
INSERT INTO communications (relatedService, relatedId, message, senderId) VALUES 
('inquiry', @inquiry3_id, '您好，我们想再次采购1000kg草甘膦原药，上次合作很愉快。', @buyer_user_id),
('inquiry', @inquiry3_id, '谢谢信任！老客户价格95000美元，包装按您的要求25kg/袋，木托盘。', @supplier_user_id),
('inquiry', @inquiry3_id, '好的，价格没问题。什么时候能发货？', @buyer_user_id),
('inquiry', @inquiry3_id, '收到定金后3-5个工作日发货，我们马上准备合同。', @supplier_user_id),
('inquiry', @inquiry3_id, '好的，我确认这个订单，请发合同给我。', @buyer_user_id);

-- 显示创建结果
SELECT '询价数据创建完成' AS status;
SELECT 
  i.id, 
  i.inquiryNo,
  i.status,
  JSON_EXTRACT(i.details, '$.buyerRemarks') as buyer_remarks,
  (SELECT COUNT(*) FROM communications c WHERE c.relatedService = 'inquiry' AND c.relatedId = i.id) as message_count
FROM inquiries i 
WHERE i.buyerId = @buyer_company_id 
ORDER BY i.id;