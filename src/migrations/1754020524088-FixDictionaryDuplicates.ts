import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDictionaryDuplicates1754020524088 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 修复字典重复数据问题 - 2025-08-01
        // 注意：数据清理工作已经通过SQL脚本完成，此迁移仅作为记录
        
        // 1. 软删除重复的字典项（保留第一个创建的）
        // 已执行：软删除了9个完全重复的记录
        
        // 2. 重新编码有意义差异的重复项
        // 已执行：
        // - GB(饵粒) -> BL(饵粒)  
        // - PA(膏剂) -> OI(膏剂)
        // - WS(种子处理可分散粉剂) -> SDP(种子处理可分散粉剂)
        
        // 3. 物理删除软删除的记录以确保唯一约束
        // 已执行：DELETE FROM dictionary_items WHERE deletedAt IS NOT NULL
        
        // 4. 验证唯一约束已生效
        // 现有的 uk_dictionary_items_category_code (categoryId, code) 约束已确保同一分类下代码唯一
        
        console.log('Dictionary duplicates fix migration - data cleanup completed via SQL scripts');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 此迁移的回滚需要手动恢复数据，因为涉及数据删除和重编码
        // 建议从备份恢复相关数据
        console.log('Warning: This migration involves data deletion and re-coding. Manual data restore required.');
    }

}
