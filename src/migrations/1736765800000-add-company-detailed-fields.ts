import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyDetailedFields1736765800000 implements MigrationInterface {
  name = 'AddCompanyDetailedFields1736765800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加新的企业详细信息字段
    await queryRunner.query(`
      ALTER TABLE \`companies\` 
      ADD COLUMN \`country\` varchar(10) NULL COMMENT '国家代码',
      ADD COLUMN \`businessCategories\` json NULL COMMENT '业务类别（多个）',
      ADD COLUMN \`businessScope\` json NULL COMMENT '业务范围描述',
      ADD COLUMN \`companySize\` varchar(50) NULL COMMENT '公司规模',
      ADD COLUMN \`mainProducts\` json NULL COMMENT '主要产品/采购产品',
      ADD COLUMN \`mainSuppliers\` json NULL COMMENT '主要供应商（采购商填写）',
      ADD COLUMN \`annualImportExportValue\` decimal(15,2) NULL COMMENT '年进口/出口额（美元）',
      ADD COLUMN \`registrationNumber\` varchar(100) NULL COMMENT '注册证号',
      ADD COLUMN \`taxNumber\` varchar(100) NULL COMMENT '税号',
      ADD COLUMN \`businessLicenseUrl\` varchar(500) NULL COMMENT '营业执照图片地址',
      ADD COLUMN \`companyPhotosUrls\` json NULL COMMENT '公司照片地址列表'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：删除添加的字段
    await queryRunner.query(`
      ALTER TABLE \`companies\` 
      DROP COLUMN \`companyPhotosUrls\`,
      DROP COLUMN \`businessLicenseUrl\`,
      DROP COLUMN \`taxNumber\`,
      DROP COLUMN \`registrationNumber\`,
      DROP COLUMN \`annualImportExportValue\`,
      DROP COLUMN \`mainSuppliers\`,
      DROP COLUMN \`mainProducts\`,
      DROP COLUMN \`companySize\`,
      DROP COLUMN \`businessScope\`,
      DROP COLUMN \`businessCategories\`,
      DROP COLUMN \`country\`
    `);
  }
}