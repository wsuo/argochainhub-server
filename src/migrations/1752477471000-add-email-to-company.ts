import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailToCompany1752477471000 implements MigrationInterface {
  name = 'AddEmailToCompany1752477471000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\` 
      ADD \`email\` varchar(100) NULL COMMENT '企业邮箱'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\` 
      DROP COLUMN \`email\`
    `);
  }
}