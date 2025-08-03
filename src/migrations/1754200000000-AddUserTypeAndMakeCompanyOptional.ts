import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTypeAndMakeCompanyOptional1754200000000 implements MigrationInterface {
  name = 'AddUserTypeAndMakeCompanyOptional1754200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 userType 字段
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`userType\` enum('individual_buyer', 'supplier') 
      NOT NULL DEFAULT 'individual_buyer' 
      COMMENT '用户类型'
    `);

    // 修改 companyId 字段为可选
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      MODIFY COLUMN \`companyId\` bigint UNSIGNED NULL 
      COMMENT '企业ID，个人采购商为空'
    `);

    // 对于现有的企业用户，设置为供应商类型
    await queryRunner.query(`
      UPDATE \`users\` u
      JOIN \`companies\` c ON u.companyId = c.id
      SET u.userType = 'supplier'
      WHERE c.type = 'supplier'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 userType 字段
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`userType\`
    `);

    // 恢复 companyId 字段为必填（注意：这可能会失败如果有空值）
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      MODIFY COLUMN \`companyId\` bigint UNSIGNED NOT NULL
    `);
  }
}