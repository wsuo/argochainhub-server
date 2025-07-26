import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFields1738100000000 implements MigrationInterface {
  name = 'AddUserFields1738100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加新字段到 users 表
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      ADD COLUMN \`phone\` varchar(20) NULL COMMENT '电话号码',
      ADD COLUMN \`avatar\` varchar(500) NULL COMMENT '头像URL',
      ADD COLUMN \`position\` varchar(100) NULL COMMENT '职位/岗位',
      ADD COLUMN \`department\` varchar(100) NULL COMMENT '部门',
      ADD COLUMN \`joinedAt\` date NULL COMMENT '入职时间',
      ADD COLUMN \`emailVerified\` tinyint NOT NULL DEFAULT 0 COMMENT '邮箱是否已验证'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：删除添加的字段
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      DROP COLUMN \`phone\`,
      DROP COLUMN \`avatar\`,
      DROP COLUMN \`position\`,
      DROP COLUMN \`department\`,
      DROP COLUMN \`joinedAt\`,
      DROP COLUMN \`emailVerified\`
    `);
  }
}