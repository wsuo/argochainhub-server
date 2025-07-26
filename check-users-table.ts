import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

async function checkUsersTableStructure() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: '100.72.60.117',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'argochainhub',
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('数据库连接成功');
    
    // 查看users表结构
    const result = await dataSource.query('DESCRIBE users');
    console.log('Users表结构:');
    console.table(result);
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkUsersTableStructure();