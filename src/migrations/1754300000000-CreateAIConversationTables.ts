import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAIConversationTables1754300000000 implements MigrationInterface {
  name = 'CreateAIConversationTables1754300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建 ai_conversations 表（会话表）
    await queryRunner.query(`
      CREATE TABLE \`ai_conversations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`conversation_id\` varchar(36) NOT NULL COMMENT '会话UUID',
        \`user_id\` int NULL COMMENT '用户ID，可为空（访客）',
        \`guest_id\` varchar(50) NULL COMMENT '访客唯一标识（localStorage UUID）',
        \`user_type\` enum('user', 'admin', 'guest') NOT NULL DEFAULT 'guest' COMMENT '用户类型',
        \`title\` varchar(255) NULL COMMENT '会话标题',
        \`user_query\` text NULL COMMENT '用户原始提问',
        \`user_inputs\` json NULL COMMENT '用户输入参数',
        \`final_answer\` text NULL COMMENT 'AI最终回答',
        \`duration\` int NULL COMMENT '对话持续时间(毫秒)',
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否活跃',
        \`total_messages\` int NOT NULL DEFAULT 0 COMMENT '消息总数',
        \`total_tokens\` int NOT NULL DEFAULT 0 COMMENT '总token数',
        \`total_cost\` decimal(10, 6) NOT NULL DEFAULT 0 COMMENT '总花费（美元）',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_conversation_id\` (\`conversation_id\`),
        INDEX \`IDX_user_id\` (\`user_id\`),
        INDEX \`IDX_guest_id\` (\`guest_id\`),
        INDEX \`IDX_created_at\` (\`created_at\`),
        INDEX \`IDX_user_type\` (\`user_type\`)
      ) ENGINE=InnoDB
    `);

    // 2. 创建 ai_messages 表（消息表）
    await queryRunner.query(`
      CREATE TABLE \`ai_messages\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`message_id\` varchar(36) NOT NULL COMMENT '消息UUID',
        \`conversation_id\` varchar(36) NOT NULL COMMENT '会话UUID',
        \`task_id\` varchar(36) NULL COMMENT '任务ID',
        \`workflow_run_id\` varchar(36) NULL COMMENT '工作流运行ID',
        \`message_type\` enum('user_query', 'ai_response') NOT NULL COMMENT '消息类型',
        \`content\` text NULL COMMENT '消息内容',
        \`metadata\` json NULL COMMENT '元数据信息',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_message_id\` (\`message_id\`),
        INDEX \`IDX_conversation_id\` (\`conversation_id\`),
        INDEX \`IDX_workflow_run_id\` (\`workflow_run_id\`),
        INDEX \`IDX_created_at\` (\`created_at\`),
        INDEX \`IDX_message_type\` (\`message_type\`),
        CONSTRAINT \`FK_messages_conversation\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`ai_conversations\`(\`conversation_id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // 3. 创建 ai_workflow_runs 表（工作流运行记录表）
    await queryRunner.query(`
      CREATE TABLE \`ai_workflow_runs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`workflow_run_id\` varchar(36) NOT NULL COMMENT '工作流运行UUID',
        \`conversation_id\` varchar(36) NOT NULL COMMENT '会话UUID',
        \`message_id\` varchar(36) NOT NULL COMMENT '消息UUID',
        \`workflow_id\` varchar(36) NULL COMMENT '工作流ID',
        \`status\` enum('running', 'succeeded', 'failed') NOT NULL COMMENT '运行状态',
        \`outputs\` json NULL COMMENT '输出结果',
        \`error_message\` text NULL COMMENT '错误信息',
        \`elapsed_time\` decimal(8, 6) NULL COMMENT '执行时间（秒）',
        \`total_tokens\` int NOT NULL DEFAULT 0 COMMENT '总token数',
        \`total_steps\` int NOT NULL DEFAULT 0 COMMENT '总步骤数',
        \`exceptions_count\` int NOT NULL DEFAULT 0 COMMENT '异常次数',
        \`created_by_user_id\` varchar(36) NULL COMMENT '创建用户ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`finished_at\` timestamp NULL COMMENT '完成时间',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_workflow_run_id\` (\`workflow_run_id\`),
        INDEX \`IDX_conversation_id_workflow\` (\`conversation_id\`),
        INDEX \`IDX_message_id_workflow\` (\`message_id\`),
        INDEX \`IDX_status\` (\`status\`),
        INDEX \`IDX_created_at_workflow\` (\`created_at\`),
        CONSTRAINT \`FK_workflow_runs_conversation\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`ai_conversations\`(\`conversation_id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_workflow_runs_message\` FOREIGN KEY (\`message_id\`) REFERENCES \`ai_messages\`(\`message_id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // 4. 创建 ai_usage_statistics 表（使用统计表）
    await queryRunner.query(`
      CREATE TABLE \`ai_usage_statistics\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`message_id\` varchar(36) NOT NULL COMMENT '消息UUID',
        \`conversation_id\` varchar(36) NOT NULL COMMENT '会话UUID',
        \`prompt_tokens\` int NOT NULL DEFAULT 0 COMMENT '输入token数',
        \`completion_tokens\` int NOT NULL DEFAULT 0 COMMENT '输出token数',
        \`total_tokens\` int NOT NULL DEFAULT 0 COMMENT '总token数',
        \`prompt_unit_price\` decimal(10, 8) NOT NULL DEFAULT 0 COMMENT '输入token单价',
        \`completion_unit_price\` decimal(10, 8) NOT NULL DEFAULT 0 COMMENT '输出token单价',
        \`prompt_price\` decimal(10, 8) NOT NULL DEFAULT 0 COMMENT '输入token费用',
        \`completion_price\` decimal(10, 8) NOT NULL DEFAULT 0 COMMENT '输出token费用',
        \`total_price\` decimal(10, 8) NOT NULL DEFAULT 0 COMMENT '总费用',
        \`currency\` varchar(3) NOT NULL DEFAULT 'USD' COMMENT '货币单位',
        \`price_unit\` decimal(10, 8) NOT NULL DEFAULT 0.000001 COMMENT '价格单位',
        \`latency\` decimal(10, 6) NULL COMMENT '延迟时间（秒）',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` timestamp NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_message_id_usage\` (\`message_id\`),
        INDEX \`IDX_conversation_id_usage\` (\`conversation_id\`),
        INDEX \`IDX_created_at_usage\` (\`created_at\`),
        INDEX \`IDX_total_price\` (\`total_price\`),
        INDEX \`IDX_total_tokens\` (\`total_tokens\`),
        CONSTRAINT \`FK_usage_statistics_conversation\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`ai_conversations\`(\`conversation_id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_usage_statistics_message\` FOREIGN KEY (\`message_id\`) REFERENCES \`ai_messages\`(\`message_id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 按照外键依赖顺序删除表
    await queryRunner.query(`DROP TABLE \`ai_usage_statistics\``);
    await queryRunner.query(`DROP TABLE \`ai_workflow_runs\``);
    await queryRunner.query(`DROP TABLE \`ai_messages\``);
    await queryRunner.query(`DROP TABLE \`ai_conversations\``);
  }
}