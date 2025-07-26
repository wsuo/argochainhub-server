import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

async function checkCompanyStatus() {
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
    
    // 查看企业状态
    const result = await dataSource.query(`
      SELECT id, name, status, type FROM companies WHERE id = 3
    `);
    console.log('企业3状态:');
    console.table(result);
    
    // 激活企业
    const updateResult = await dataSource.query(`
      UPDATE companies SET status = 'active' WHERE id = 3
    `);
    console.log('企业状态更新结果:', updateResult);
    
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkCompanyStatus();