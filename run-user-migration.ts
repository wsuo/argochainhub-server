import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

async function runSpecificMigration() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: '100.72.60.117',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'argochainhub',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/1738100000000-add-user-fields.ts'], // 只运行我们需要的迁移
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('数据库连接成功');
    
    // 运行迁移
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('没有新的迁移需要运行');
    } else {
      console.log(`成功运行了 ${migrations.length} 个迁移:`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    }
    
  } catch (error) {
    console.error('迁移运行失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

runSpecificMigration();