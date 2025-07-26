import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

async function checkCompanyUsers() {
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
    
    // 查看企业3的用户
    const result = await dataSource.query(`
      SELECT u.id, u.email, u.name, u.role, u.phone, u.avatar, u.position, u.department, u.joinedAt, u.emailVerified, u.isActive, c.name as companyName
      FROM users u 
      LEFT JOIN companies c ON u.companyId = c.id
      WHERE u.companyId = 3
    `);
    console.log('企业3的用户:');
    console.table(result);
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkCompanyUsers();