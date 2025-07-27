import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsTable1753600000000 implements MigrationInterface {
  name = 'CreateNewsTable1753600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建新闻资讯表
    await queryRunner.query(`
      CREATE TABLE \`news\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`title\` json NOT NULL COMMENT '新闻标题（多语言）',
        \`content\` json NOT NULL COMMENT '新闻内容（多语言）',
        \`category\` varchar(50) NULL COMMENT '新闻类别（字典值）',
        \`coverImage\` varchar(500) NULL COMMENT '封面图URL',
        \`sortOrder\` int NOT NULL DEFAULT 0 COMMENT '排序字段',
        \`isPublished\` tinyint NOT NULL DEFAULT 0 COMMENT '是否发布',
        \`publishedAt\` datetime NULL COMMENT '发布时间',
        \`viewCount\` int NOT NULL DEFAULT 0 COMMENT '浏览次数',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_NEWS_CATEGORY\` (\`category\`),
        INDEX \`IDX_NEWS_PUBLISHED\` (\`isPublished\`),
        INDEX \`IDX_NEWS_SORT\` (\`sortOrder\`),
        INDEX \`IDX_NEWS_PUBLISHED_AT\` (\`publishedAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='新闻资讯表'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`news\``);
  }
}