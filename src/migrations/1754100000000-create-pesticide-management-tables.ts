import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePesticideManagementTables1754100000000 implements MigrationInterface {
  name = 'CreatePesticideManagementTables1754100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建标准农药表
    await queryRunner.query(`
      CREATE TABLE \`standard_pesticides\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`category\` varchar(50) NOT NULL COMMENT '产品类别（字典值，来源：product_category）',
        \`formulation\` varchar(50) NOT NULL COMMENT '剂型（字典值，来源：formulation）',
        \`productName\` json NOT NULL COMMENT '产品名称（多语言）',
        \`concentration\` varchar(100) NOT NULL COMMENT '含量规格',
        \`isVisible\` tinyint NOT NULL DEFAULT 1 COMMENT '是否显示',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_STANDARD_PESTICIDES_CATEGORY\` (\`category\`),
        INDEX \`IDX_STANDARD_PESTICIDES_FORMULATION\` (\`formulation\`),
        INDEX \`IDX_STANDARD_PESTICIDES_VISIBLE\` (\`isVisible\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标准农药信息表'
    `);

    // 创建农药价格走势表
    await queryRunner.query(`
      CREATE TABLE \`pesticide_price_trends\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`weekEndDate\` date NOT NULL COMMENT '周最后日期（如：2025-07-25）',
        \`unitPrice\` decimal(12,2) NOT NULL COMMENT '单位价格（元）',
        \`pesticideId\` bigint UNSIGNED NOT NULL COMMENT '标准农药ID',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_PESTICIDE_PRICE_TREND_UNIQUE\` (\`weekEndDate\`, \`pesticideId\`),
        INDEX \`IDX_PESTICIDE_PRICE_TREND_DATE\` (\`weekEndDate\`),
        INDEX \`IDX_PESTICIDE_PRICE_TREND_PESTICIDE\` (\`pesticideId\`),
        CONSTRAINT \`FK_PESTICIDE_PRICE_TREND_PESTICIDE\` FOREIGN KEY (\`pesticideId\`) REFERENCES \`standard_pesticides\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='农药价格走势表'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`pesticide_price_trends\``);
    await queryRunner.query(`DROP TABLE \`standard_pesticides\``);
  }
}