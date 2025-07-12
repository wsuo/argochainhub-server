import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../seed/seed.service';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    console.log('🌱 开始初始化数据库数据...');
    await seedService.seedAll();
    console.log('✅ 数据库数据初始化完成!');

    console.log('\n📝 创建的账户信息:');
    console.log('====================');
    console.log('🔧 系统管理员账户:');
    console.log('   超级管理员: superadmin / Admin123!');
    console.log('   普通管理员: admin / Admin123!');

    console.log('\n🏢 企业买家账户:');
    console.log('   企业: 阳光农业采购有限公司');
    console.log('   所有者: buyer.owner@yangguang-agri.com / User123!');
    console.log('   管理员: buyer.admin@yangguang-agri.com / User123!');
    console.log('   成员: buyer.member@yangguang-agri.com / User123!');

    console.log('\n🏭 企业供应商账户:');
    console.log('   企业1: 绿田化工科技有限公司');
    console.log('   所有者: supplier.owner@lutian-chem.com / User123!');
    console.log('   管理员: supplier.admin@lutian-chem.com / User123!');

    console.log('\n   企业2: 华农生物科技集团');
    console.log('   所有者: supplier2.owner@huanong-bio.com / User123!');

    console.log('\n💰 创建的订阅套餐:');
    console.log('   基础版: ¥99/月');
    console.log('   专业版: ¥299/月');
    console.log('   企业版: ¥999/月');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function clearSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    console.log('🧹 开始清理数据库数据...');
    await seedService.clearAll();
    console.log('✅ 数据库数据清理完成!');
  } catch (error) {
    console.error('❌ 数据清理失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// 根据命令行参数决定执行什么操作
const command = process.argv[2];

if (command === 'clear') {
  clearSeed();
} else {
  runSeed();
}
