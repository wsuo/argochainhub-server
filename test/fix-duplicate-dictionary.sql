-- 修复字典项重复数据的SQL脚本
-- 针对formulation字典中的重复code值

-- 设置SQL模式，允许操作
SET SESSION sql_mode = '';

-- 1. 首先查看当前重复的数据情况
SELECT '=== 当前重复数据情况 ===' as message;
SELECT 
    dc.code as category_code,
    di.code as item_code,
    COUNT(*) as count
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE dc.code = 'formulation'
AND di.deletedAt IS NULL
GROUP BY dc.code, di.code
HAVING COUNT(*) > 1
ORDER BY di.code;

-- 2. 对于每个重复的code，保留最早创建的记录，删除其他记录

-- CJF - 保留id=380（微胶囊粉剂），删除id=409（微囊粉剂）
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 409;

-- DS - 保留id=402（干粉种衣剂），删除其他两个
UPDATE dictionary_items SET deletedAt = NOW() WHERE id IN (417, 461);

-- FU - 两个完全相同的烟剂，保留id=475，删除id=483
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 483;

-- GB - 保留id=388（干拌剂），删除id=459（饵粒）- 这两个含义不同，需要重新编码
-- 将饵粒的code改为BL（Bait pelLets）
UPDATE dictionary_items SET code = 'BL' WHERE id = 459;

-- JJF - 保留id=420（结晶），删除id=454（结晶粉）
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 454;

-- LTN - 保留id=404（长效防蚊帐），删除id=412（驱蚊帐）
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 412;

-- PA - 保留id=453（糊剂），删除id=464（膏剂）- 这两个含义不同，需要重新编码
-- 将膏剂的code改为OI（Ointment）
UPDATE dictionary_items SET code = 'OI' WHERE id = 464;

-- RB - 保留id=468（毒饵），删除id=480（饵剂）
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 480;

-- WG - 两个含义相似（可分散粒剂 vs 水分散粒剂），保留id=411，删除id=489
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 489;

-- WS - 保留id=448（湿拌种剂），删除id=473（种子处理可分散粉剂）- 含义不同，重新编码
-- 将种子处理可分散粉剂的code改为SDP（Seed treatment Dispersible Powder）
UPDATE dictionary_items SET code = 'SDP' WHERE id = 473;

-- ZC - 两个含义相似，保留id=432，删除id=471
UPDATE dictionary_items SET deletedAt = NOW() WHERE id = 471;

-- 3. 验证修复结果
SELECT '=== 修复后的重复数据检查 ===' as message;
SELECT 
    dc.code as category_code,
    di.code as item_code,
    COUNT(*) as count
FROM dictionary_items di
JOIN dictionary_categories dc ON di.categoryId = dc.id
WHERE dc.code = 'formulation'
AND di.deletedAt IS NULL
GROUP BY dc.code, di.code
HAVING COUNT(*) > 1
ORDER BY di.code;

-- 4. 显示修改的记录
SELECT '=== 被重新编码的记录 ===' as message;
SELECT id, code, name, createdAt FROM dictionary_items WHERE id IN (459, 464, 473) AND deletedAt IS NULL;

SELECT '=== 被软删除的记录 ===' as message;
SELECT id, code, name, deletedAt FROM dictionary_items WHERE id IN (409, 417, 461, 483, 454, 412, 480, 489, 471) AND deletedAt IS NOT NULL;