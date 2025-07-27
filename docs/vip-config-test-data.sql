-- VIP配置测试数据
-- 注意：请先确保vip_configs表已创建

-- 供应商配置
INSERT INTO vip_configs (
  name, platform, level, currency, originalPrice, currentPrice, discount,
  days, accountQuota, maxPurchaseCount, bonusDays, sampleViewCount,
  vipLevelNumber, inquiryManagementCount, registrationManagementCount,
  productPublishCount, viewCount, remarkZh, remarkEn, remarkEs,
  isActive, sortOrder, createdAt, updatedAt
) VALUES
-- 供应商促销版
(
  '{"zh-CN": "供应商促销版", "en": "Supplier Promotion Edition", "es": "Edición Promocional del Proveedor"}',
  'supplier', 'promotion', 'USD', 99.00, 49.00, '50折',
  30, 1, 1, 0, 10, 1, 5, 2, 10, 20,
  '限时促销方案，适合新供应商体验',
  'Limited time promotion, suitable for new suppliers to try',
  'Promoción por tiempo limitado, adecuada para que los nuevos proveedores prueben',
  1, 1, NOW(), NOW()
),
-- 供应商基础版
(
  '{"zh-CN": "供应商基础版", "en": "Supplier Basic Edition", "es": "Edición Básica del Proveedor"}',
  'supplier', 'basic', 'USD', 299.00, 199.00, '67折',
  365, 5, 3, 0, 50, 2, 30, 10, 50, 100,
  '适合中小型供应商的基础方案',
  'Basic plan suitable for small and medium suppliers',
  'Plan básico adecuado para proveedores pequeños y medianos',
  1, 2, NOW(), NOW()
),
-- 供应商高级版
(
  '{"zh-CN": "供应商高级版", "en": "Supplier Advanced Edition", "es": "Edición Avanzada del Proveedor"}',
  'supplier', 'advanced', 'USD', 999.00, 699.00, '70折',
  365, 20, 5, 60, 200, 3, 100, 50, 200, 500,
  '适合大型供应商的高级方案，功能全面',
  'Advanced plan suitable for large suppliers with comprehensive features',
  'Plan avanzado adecuado para grandes proveedores con características integrales',
  1, 3, NOW(), NOW()
),

-- 采购商配置
-- 采购商促销版
(
  '{"zh-CN": "采购商促销版", "en": "Purchaser Promotion Edition", "es": "Edición Promocional del Comprador"}',
  'purchaser', 'promotion', 'CNY', 699.00, 349.00, '50折',
  30, 1, 1, 0, 20, 1, 10, 5, 0, 50,
  '限时促销方案，适合新采购商体验',
  'Limited time promotion, suitable for new purchasers to try',
  'Promoción por tiempo limitado, adecuada para que los nuevos compradores prueben',
  1, 1, NOW(), NOW()
),
-- 采购商基础版
(
  '{"zh-CN": "采购商基础版", "en": "Purchaser Basic Edition", "es": "Edición Básica del Comprador"}',
  'purchaser', 'basic', 'CNY', 1999.00, 1299.00, '65折',
  365, 3, 3, 0, 100, 2, 50, 20, 0, 200,
  '适合中小型采购商的基础方案',
  'Basic plan suitable for small and medium purchasers',
  'Plan básico adecuado para compradores pequeños y medianos',
  1, 2, NOW(), NOW()
),
-- 采购商高级版
(
  '{"zh-CN": "采购商高级版", "en": "Purchaser Advanced Edition", "es": "Edición Avanzada del Comprador"}',
  'purchaser', 'advanced', 'CNY', 6999.00, 4999.00, '71折',
  365, 10, 5, 90, 500, 3, 200, 100, 0, 1000,
  '适合大型采购商的高级方案，权限充足',
  'Advanced plan suitable for large purchasers with sufficient permissions',
  'Plan avanzado adecuado para grandes compradores con permisos suficientes',
  1, 3, NOW(), NOW()
);

-- 查询插入的数据
SELECT * FROM vip_configs ORDER BY platform, sortOrder;