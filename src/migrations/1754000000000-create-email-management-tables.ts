import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailManagementTables1754000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建邮件配置表
    await queryRunner.createTable(
      new Table({
        name: 'email_configs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            comment: '配置名称',
          },
          {
            name: 'host',
            type: 'varchar',
            length: '255',
            comment: 'SMTP服务器地址',
          },
          {
            name: 'port',
            type: 'int',
            comment: 'SMTP端口号',
          },
          {
            name: 'secure',
            type: 'boolean',
            default: true,
            comment: '是否使用SSL/TLS',
          },
          {
            name: 'auth_user',
            type: 'varchar',
            length: '255',
            comment: '认证用户名',
          },
          {
            name: 'auth_pass',
            type: 'varchar',
            length: '500',
            comment: '认证密码（加密存储）',
          },
          {
            name: 'from_email',
            type: 'varchar',
            length: '255',
            comment: '发件人邮箱',
          },
          {
            name: 'from_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: '发件人名称',
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            comment: '是否为默认配置',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: '是否启用',
          },
          {
            name: 'max_retries',
            type: 'int',
            default: 3,
            comment: '最大重试次数',
          },
          {
            name: 'retry_delay',
            type: 'int',
            default: 60,
            comment: '重试延迟（秒）',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // 创建邮件模板表
    await queryRunner.createTable(
      new Table({
        name: 'email_templates',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
            comment: '模板代码（如：inquiry_notification）',
          },
          {
            name: 'name',
            type: 'json',
            comment: '模板名称（多语言）',
          },
          {
            name: 'description',
            type: 'json',
            isNullable: true,
            comment: '模板描述（多语言）',
          },
          {
            name: 'subject',
            type: 'json',
            comment: '邮件主题（多语言）',
          },
          {
            name: 'body',
            type: 'json',
            comment: '邮件内容（HTML格式，多语言）',
          },
          {
            name: 'variables',
            type: 'json',
            isNullable: true,
            comment: '支持的变量列表',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: '是否启用',
          },
          {
            name: 'trigger_event',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: '触发事件（如：inquiry.created）',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // 创建邮件发送历史表
    await queryRunner.createTable(
      new Table({
        name: 'email_histories',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            unsigned: true,
          },
          {
            name: 'template_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
            comment: '使用的模板ID',
          },
          {
            name: 'config_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
            comment: '使用的配置ID',
          },
          {
            name: 'to_email',
            type: 'varchar',
            length: '255',
            comment: '收件人邮箱',
          },
          {
            name: 'to_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: '收件人名称',
          },
          {
            name: 'cc_emails',
            type: 'json',
            isNullable: true,
            comment: '抄送邮箱列表',
          },
          {
            name: 'bcc_emails',
            type: 'json',
            isNullable: true,
            comment: '密送邮箱列表',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
            comment: '邮件主题',
          },
          {
            name: 'body',
            type: 'text',
            comment: '邮件内容',
          },
          {
            name: 'variables',
            type: 'json',
            isNullable: true,
            comment: '使用的变量值',
          },
          {
            name: 'language',
            type: 'varchar',
            length: '10',
            default: "'zh-CN'",
            comment: '邮件语言',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sending', 'sent', 'failed', 'retry'],
            default: "'pending'",
            comment: '发送状态',
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
            comment: '发送尝试次数',
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
            comment: '发送时间',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: '错误信息',
          },
          {
            name: 'related_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: '关联类型（如：inquiry, sample_request）',
          },
          {
            name: 'related_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
            comment: '关联ID',
          },
          {
            name: 'created_by',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
            comment: '创建人ID',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // 创建索引
    await queryRunner.createIndex(
      'email_configs',
      new TableIndex({
        name: 'idx_email_configs_is_default',
        columnNames: ['is_default'],
      }),
    );

    await queryRunner.createIndex(
      'email_templates',
      new TableIndex({
        name: 'idx_email_templates_code',
        columnNames: ['code'],
      }),
    );

    await queryRunner.createIndex(
      'email_templates',
      new TableIndex({
        name: 'idx_email_templates_trigger_event',
        columnNames: ['trigger_event'],
      }),
    );

    await queryRunner.createIndex(
      'email_histories',
      new TableIndex({
        name: 'idx_email_histories_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'email_histories',
      new TableIndex({
        name: 'idx_email_histories_related',
        columnNames: ['related_type', 'related_id'],
      }),
    );

    await queryRunner.createIndex(
      'email_histories',
      new TableIndex({
        name: 'idx_email_histories_created_at',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('email_histories', 'idx_email_histories_created_at');
    await queryRunner.dropIndex('email_histories', 'idx_email_histories_related');
    await queryRunner.dropIndex('email_histories', 'idx_email_histories_status');
    await queryRunner.dropIndex('email_templates', 'idx_email_templates_trigger_event');
    await queryRunner.dropIndex('email_templates', 'idx_email_templates_code');
    await queryRunner.dropIndex('email_configs', 'idx_email_configs_is_default');

    // 删除表
    await queryRunner.dropTable('email_histories');
    await queryRunner.dropTable('email_templates');
    await queryRunner.dropTable('email_configs');
  }
}