import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionsToAdminUser1737638000000 implements MigrationInterface {
  name = 'AddPermissionsToAdminUser1737638000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`admin_users\` 
      ADD \`permissions\` json NULL COMMENT '用户具体权限列表',
      ADD \`isSystemUser\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为系统内置用户'
    `);

    // 为现有用户根据角色设置默认权限
    await queryRunner.query(`
      UPDATE \`admin_users\` 
      SET \`permissions\` = JSON_ARRAY(
        'company:view', 'company:create', 'company:update', 'company:review',
        'product:view', 'product:create', 'product:update', 'product:review',
        'user:view', 'user:create', 'user:update', 'user:manage_subscription',
        'inquiry:view', 'inquiry:manage', 'sample_request:view', 'sample_request:manage',
        'registration_request:view', 'registration_request:manage', 'order:view', 'order:manage',
        'plan:view', 'plan:create', 'plan:update',
        'dictionary:manage', 'audit_log:view', 'file:manage',
        'analytics:view', 'dashboard:view'
      )
      WHERE \`role\` = 'admin'
    `);

    await queryRunner.query(`
      UPDATE \`admin_users\` 
      SET \`permissions\` = JSON_ARRAY(
        'company:view', 'company:review',
        'product:view', 'product:review',
        'inquiry:view', 'sample_request:view', 'registration_request:view', 'order:view',
        'user:view', 'plan:view', 'dashboard:view'
      )
      WHERE \`role\` = 'moderator'
    `);

    // super_admin不需要设置具体权限，代码中会处理
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`admin_users\` 
      DROP COLUMN \`permissions\`,
      DROP COLUMN \`isSystemUser\`
    `);
  }
}