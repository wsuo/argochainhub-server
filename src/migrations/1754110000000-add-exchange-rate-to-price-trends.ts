import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExchangeRateToPriceTrends1754110000000 implements MigrationInterface {
  name = 'AddExchangeRateToPriceTrends1754110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 为价格走势表添加汇率字段
    await queryRunner.query(`
      ALTER TABLE \`pesticide_price_trends\` 
      ADD COLUMN \`exchangeRate\` decimal(8,4) NOT NULL 
      COMMENT '人民币美元汇率（1美元=X人民币）' 
      AFTER \`unitPrice\`
    `);

    // 为现有数据设置默认汇率值（当前大概汇率 1USD = 7.3CNY）
    await queryRunner.query(`
      UPDATE \`pesticide_price_trends\` 
      SET \`exchangeRate\` = 7.3000 
      WHERE \`exchangeRate\` IS NULL OR \`exchangeRate\` = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除汇率字段
    await queryRunner.query(`
      ALTER TABLE \`pesticide_price_trends\` 
      DROP COLUMN \`exchangeRate\`
    `);
  }
}