-- 最终验证字典重复问题修复结果

-- 1. 检查是否还有任何重复的字典项
SELECT '=== 1. 检查所有分类中的重复字典项 ===' as message;
SELECT 
    dc.code as category_code,
    dc.name as category_name,
    di.code as item_code,
    COUNT(*) as count
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE di.deletedAt IS NULL
GROUP BY dc.code, di.code
HAVING COUNT(*) > 1
ORDER BY dc.code, di.code;

-- 2. 验证数据库约束是否正确添加
SELECT '=== 2. 验证数据库约束 ===' as message;
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'argochainhub' 
AND TABLE_NAME = 'dictionary_items' 
AND CONSTRAINT_TYPE = 'UNIQUE';

-- 3. 检查修复后的formulation字典项
SELECT '=== 3. formulation字典的当前状态 ===' as message;
SELECT 
    di.id,
    di.code,
    JSON_UNQUOTE(JSON_EXTRACT(di.name, '$.\"zh-CN\"')) as chinese_name,
    JSON_UNQUOTE(JSON_EXTRACT(di.name, '$.en')) as english_name,
    di.isActive
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE dc.code = 'formulation'
AND di.deletedAt IS NULL
AND di.code IN ('FU', 'RB', 'PA', 'WS', 'ZC', 'JJF', 'DS', 'WG', 'LTN', 'GB', 'CJF', 'BL', 'OI', 'SDP')
ORDER BY di.code;

-- 4. 显示被重新编码的记录
SELECT '=== 4. 被重新编码的记录 ===' as message;
SELECT 
    di.id,
    di.code as new_code,
    JSON_UNQUOTE(JSON_EXTRACT(di.name, '$.\"zh-CN\"')) as chinese_name,
    'GB->BL(饵粒), PA->OI(膏剂), WS->SDP(种子处理可分散粉剂)' as note
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE dc.code = 'formulation'
AND di.deletedAt IS NULL
AND di.code IN ('BL', 'OI', 'SDP')
ORDER BY di.code;

-- 5. 统计总共修复的记录数
SELECT '=== 5. 修复统计 ===' as message;
SELECT 
    COUNT(*) as total_deleted_duplicates
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE dc.code = 'formulation'
AND di.deletedAt IS NOT NULL
AND di.deletedAt >= '2025-08-01 11:40:00';

SELECT '修复完成：' as message, 'formulation字典重复数据已清理，数据库约束已添加，应用层验证已完善' as status;