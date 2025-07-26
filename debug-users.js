const { DataSource } = require('typeorm');
const { User } = require('./src/entities/user.entity');

async function debugGetAllUsers() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: '100.72.60.117',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'argochainhub',
    entities: ['./src/entities/*.entity.js'],
    synchronize: false
  });

  try {
    await dataSource.initialize();
    console.log('数据库连接成功');

    const userRepository = dataSource.getRepository('User');
    
    // 尝试简单查询
    console.log('尝试简单查询...');
    const simpleQuery = await userRepository.find({ take: 5 });
    console.log('简单查询成功，返回', simpleQuery.length, '条记录');

    // 尝试使用query builder
    console.log('尝试使用query builder...');
    const queryBuilder = userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.subscriptions', 'subscriptions')
      .leftJoinAndSelect('subscriptions.plan', 'plan')
      .take(5);
    
    const [users, total] = await queryBuilder.getManyAndCount();
    console.log('Query builder查询成功，返回', users.length, '条记录，总数', total);

    await dataSource.destroy();
  } catch (error) {
    console.error('错误详情：', error);
  }
}

debugGetAllUsers();