import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class UpdateProductAndCreateControlMethod1738000000000 implements MigrationInterface {
  name = 'UpdateProductAndCreateControlMethod1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 更新 products 表结构
    const table = await queryRunner.getTable('products');
    
    // 添加新字段（如果不存在）
    const columnsToAdd = [
      new TableColumn({
        name: 'pesticideName',
        type: 'json',
        isNullable: false,
        comment: '农药名称（多语言）',
      }),
      new TableColumn({
        name: 'minOrderQuantity',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: '最低起订量',
      }),
      new TableColumn({
        name: 'minOrderUnit',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: '最低起订量单位',
      }),
      new TableColumn({
        name: 'registrationNumber',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: '登记证号',
      }),
      new TableColumn({
        name: 'registrationHolder',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: '登记证持有人',
      }),
      new TableColumn({
        name: 'effectiveDate',
        type: 'date',
        isNullable: true,
        comment: '有效截止日期',
      }),
      new TableColumn({
        name: 'firstApprovalDate',
        type: 'date',
        isNullable: true,
        comment: '首次批准日期',
      }),
      new TableColumn({
        name: 'totalContent',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: '总含量',
      }),
      new TableColumn({
        name: 'toxicity',
        type: 'enum',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'ACUTE'],
        isNullable: true,
        comment: '毒性等级（字典值）',
      }),
      new TableColumn({
        name: 'activeIngredient1',
        type: 'json',
        isNullable: true,
        comment: '有效成分1',
      }),
      new TableColumn({
        name: 'activeIngredient2',
        type: 'json',
        isNullable: true,
        comment: '有效成分2',
      }),
      new TableColumn({
        name: 'activeIngredient3',
        type: 'json',
        isNullable: true,
        comment: '有效成分3',
      }),
      new TableColumn({
        name: 'details',
        type: 'json',
        isNullable: true,
        comment: '产品详细信息',
      }),
      new TableColumn({
        name: 'isListed',
        type: 'boolean',
        default: false,
        comment: '是否上架',
      }),
      new TableColumn({
        name: 'rejectionReason',
        type: 'text',
        isNullable: true,
        comment: '拒绝原因',
      }),
    ];

    // 检查并添加字段
    for (const column of columnsToAdd) {
      const hasColumn = table?.columns.some(c => c.name === column.name);
      if (!hasColumn) {
        await queryRunner.addColumn('products', column);
      }
    }

    // 删除旧字段（如果存在）
    const columnsToRemove = ['category', 'casNo', 'activeIngredient', 'content', 'price', 'stock', 'certified'];
    for (const columnName of columnsToRemove) {
      const hasColumn = table?.columns.some(c => c.name === columnName);
      if (hasColumn) {
        await queryRunner.dropColumn('products', columnName);
      }
    }

    // 创建 control_methods 表
    const controlMethodsTableExists = await queryRunner.hasTable('control_methods');
    if (!controlMethodsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'control_methods',
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
              name: 'productId',
              type: 'bigint',
              unsigned: true,
              comment: '产品ID（农药ID）',
            },
            {
              name: 'targetCrop',
              type: 'json',
              comment: '目标作物（多语言）',
            },
            {
              name: 'pestDisease',
              type: 'json',
              comment: '病虫害（多语言）',
            },
            {
              name: 'applicationMethod',
              type: 'json',
              comment: '施用方法（多语言）',
            },
            {
              name: 'dosage',
              type: 'json',
              comment: '用量（多语言）',
            },
            {
              name: 'sortOrder',
              type: 'int',
              default: 0,
              comment: '排序顺序',
            },
            {
              name: 'isActive',
              type: 'boolean',
              default: true,
              comment: '是否启用',
            },
            {
              name: 'remarks',
              type: 'text',
              isNullable: true,
              comment: '备注',
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
          ],
        }),
        true,
      );

      // 创建外键
      await queryRunner.createForeignKey(
        'control_methods',
        new TableForeignKey({
          columnNames: ['productId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'products',
          onDelete: 'CASCADE',
        }),
      );

      // 创建索引
      await queryRunner.createIndex('control_methods', new TableIndex({
        name: 'IDX_CONTROL_METHODS_PRODUCT_ID',
        columnNames: ['productId'],
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 control_methods 表
    await queryRunner.dropTable('control_methods');

    // 还原 products 表（如果需要）
    // 注意：这里只是示例，实际回滚可能需要更多考虑
    const table = await queryRunner.getTable('products');
    
    // 删除新增字段
    const columnsToRemove = [
      'pesticideName',
      'minOrderQuantity',
      'minOrderUnit',
      'registrationNumber',
      'registrationHolder',
      'effectiveDate',
      'firstApprovalDate',
      'totalContent',
      'toxicity',
      'activeIngredient1',
      'activeIngredient2',
      'activeIngredient3',
      'details',
      'isListed',
      'rejectionReason',
    ];

    for (const columnName of columnsToRemove) {
      const hasColumn = table?.columns.some(c => c.name === columnName);
      if (hasColumn) {
        await queryRunner.dropColumn('products', columnName);
      }
    }

    // 添加回旧字段
    const columnsToAdd = [
      new TableColumn({
        name: 'category',
        type: 'json',
        isNullable: false,
      }),
      new TableColumn({
        name: 'casNo',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'activeIngredient',
        type: 'json',
        isNullable: false,
      }),
      new TableColumn({
        name: 'content',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'stock',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'certified',
        type: 'boolean',
        default: false,
      }),
    ];

    for (const column of columnsToAdd) {
      await queryRunner.addColumn('products', column);
    }
  }
}