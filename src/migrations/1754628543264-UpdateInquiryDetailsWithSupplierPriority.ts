import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateInquiryDetailsWithSupplierPriority1754628543264 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 更新现有记录的details字段，确保有supplierPriority字段
        await queryRunner.query(`
            UPDATE inquiries 
            SET details = JSON_MERGE_PATCH(
                COALESCE(details, JSON_OBJECT()),
                JSON_OBJECT('supplierPriority', 'normal')
            )
            WHERE JSON_EXTRACT(details, '$.supplierPriority') IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：移除supplierPriority字段
        await queryRunner.query(`
            UPDATE inquiries 
            SET details = JSON_REMOVE(details, '$.supplierPriority')
            WHERE JSON_EXTRACT(details, '$.supplierPriority') IS NOT NULL
        `);
    }

}
