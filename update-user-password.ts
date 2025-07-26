import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

// 加载环境变量
config();

async function updateUserPassword() {
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
    
    // 生成新密码hash
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 更新用户密码
    const result = await dataSource.query(`
      UPDATE users 
      SET password = ?
      WHERE email = 'supplier2.owner@huanong-bio.com'
    `, [hashedPassword]);
    
    console.log('密码更新结果:', result);
    console.log('用户密码已重置为: password123');
    
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

updateUserPassword();