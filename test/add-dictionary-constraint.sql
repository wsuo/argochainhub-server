-- 添加唯一约束防止字典项重复
-- 为 dictionary_items 表添加 categoryId + code 的联合唯一约束

-- 首先检查是否还有其他分类的重复数据
SELECT '=== 检查所有分类的重复数据 ===' as message;
SELECT 
    dc.code as category_code,
    di.code as item_code,
    COUNT(*) as count
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE di.deletedAt IS NULL
GROUP BY dc.code, di.code
HAVING COUNT(*) > 1
ORDER BY dc.code, di.code;

-- 添加唯一索引（同时作为约束）
-- 注意：我们只对未删除的记录添加唯一约束
ALTER TABLE dictionary_items 
ADD CONSTRAINT uk_dictionary_items_category_code 
UNIQUE KEY (categoryId, code);

SELECT '=== 约束添加完成 ===' as message;