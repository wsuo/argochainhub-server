import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShoppingCartTables1757000000001 implements MigrationInterface {
  name = 'CreateShoppingCartTables1757000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 shopping_carts 表
    await queryRunner.query(`
      CREATE TABLE \`shopping_carts\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`userId\` bigint UNSIGNED NOT NULL COMMENT '用户ID',
        \`status\` enum('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT '购物车状态',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_SHOPPING_CARTS_USER_ID\` (\`userId\`),
        INDEX \`IDX_SHOPPING_CARTS_STATUS\` (\`status\`),
        CONSTRAINT \`FK_SHOPPING_CARTS_USER_ID\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // 创建 cart_items 表
    await queryRunner.query(`
      CREATE TABLE \`cart_items\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`cartId\` bigint UNSIGNED NOT NULL COMMENT '购物车ID',
        \`productId\` bigint UNSIGNED NOT NULL COMMENT '产品ID',
        \`supplierId\` bigint UNSIGNED NOT NULL COMMENT '供应商ID',
        \`quantity\` decimal(15,3) NOT NULL COMMENT '数量',
        \`unit\` varchar(50) NOT NULL COMMENT '单位',
        \`productSnapshot\` json NOT NULL COMMENT '产品快照（保存添加到购物车时的产品信息）',
        \`supplierSnapshot\` json NOT NULL COMMENT '供应商信息快照',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_CART_ITEMS_CART_ID\` (\`cartId\`),
        INDEX \`IDX_CART_ITEMS_PRODUCT_ID\` (\`productId\`),
        INDEX \`IDX_CART_ITEMS_SUPPLIER_ID\` (\`supplierId\`),
        CONSTRAINT \`FK_CART_ITEMS_CART_ID\` FOREIGN KEY (\`cartId\`) REFERENCES \`shopping_carts\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_CART_ITEMS_PRODUCT_ID\` FOREIGN KEY (\`productId\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_CART_ITEMS_SUPPLIER_ID\` FOREIGN KEY (\`supplierId\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `cart_items`');
    await queryRunner.query('DROP TABLE `shopping_carts`');
  }
}