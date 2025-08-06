import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserType } from '../src/entities/user.entity';
import { Company, CompanyStatus, CompanyType } from '../src/entities/company.entity';
import { Product, ProductStatus } from '../src/entities/product.entity';
import { Inquiry, InquiryStatus } from '../src/entities/inquiry.entity';
import { InquiryItem } from '../src/entities/inquiry-item.entity';
import { Communication, RelatedService } from '../src/entities/communication.entity';

async function createTestData() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || '100.72.60.117',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'argochainhub',
    entities: [User, Company, Product, Inquiry, InquiryItem, Communication],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('数据源已初始化');

  try {
    // 1. 创建采购商公司
    const buyerCompany = dataSource.getRepository(Company).create({
      name: { zh: '北京采购有限公司', en: 'Beijing Buyer Co., Ltd.' },
      type: CompanyType.BUYER,
      status: CompanyStatus.ACTIVE,
      email: 'buyer@test.com',
      country: 'CN',
      profile: {
        description: { zh: '专业农药采购商', en: 'Professional pesticide buyer' },
        phone: '+86-10-12345678',
        address: '北京市朝阳区测试街道123号',
      },
    });
    const savedBuyerCompany = await dataSource.getRepository(Company).save(buyerCompany);
    console.log('采购商公司已创建:', savedBuyerCompany.id);

    // 2. 创建供应商公司
    const supplierCompany = dataSource.getRepository(Company).create({
      name: { zh: '上海农药供应商', en: 'Shanghai Pesticide Supplier' },
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.ACTIVE,
      email: 'supplier@test.com',
      country: 'CN',
      profile: {
        description: { zh: '专业农药生产供应商', en: 'Professional pesticide supplier' },
        phone: '+86-21-87654321',
        address: '上海市浦东新区测试路456号',
      },
    });
    const savedSupplierCompany = await dataSource.getRepository(Company).save(supplierCompany);
    console.log('供应商公司已创建:', savedSupplierCompany.id);

    // 3. 创建采购商用户
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    const buyerUser = dataSource.getRepository(User).create({
      email: 'buyer@test.com',
      password: hashedPassword,
      name: '采购经理张三',
      phone: '+86-138-1234-5678',
      type: UserType.INDIVIDUAL_BUYER,
      companyId: savedBuyerCompany.id,
    });
    const savedBuyerUser = await dataSource.getRepository(User).save(buyerUser);
    console.log('采购商用户已创建:', savedBuyerUser.id);

    // 4. 创建供应商用户
    const supplierUser = dataSource.getRepository(User).create({
      email: 'supplier@test.com',
      password: hashedPassword,
      name: '销售经理李四',
      phone: '+86-139-8765-4321',
      type: UserType.SUPPLIER,
      companyId: savedSupplierCompany.id,
    });
    const savedSupplierUser = await dataSource.getRepository(User).save(supplierUser);
    console.log('供应商用户已创建:', savedSupplierUser.id);

    // 5. 创建测试产品
    const product1 = dataSource.getRepository(Product).create({
      name: { zh: '草甘膦原药', en: 'Glyphosate Technical' },
      pesticideName: { zh: '草甘膦', en: 'Glyphosate' },
      formulation: 'TC',
      activeIngredient1: {
        name: { zh: '草甘膦', en: 'Glyphosate' },
        content: '95%',
      },
      totalContent: '95%',
      status: ProductStatus.ACTIVE,
      supplierId: savedSupplierCompany.id,
    });
    const savedProduct1 = await dataSource.getRepository(Product).save(product1);

    const product2 = dataSource.getRepository(Product).create({
      name: { zh: '阿维菌素乳油', en: 'Abamectin EC' },
      pesticideName: { zh: '阿维菌素', en: 'Abamectin' },
      formulation: 'EC',
      activeIngredient1: {
        name: { zh: '阿维菌素', en: 'Abamectin' },
        content: '1.8%',
      },
      totalContent: '1.8%',
      status: ProductStatus.ACTIVE,
      supplierId: savedSupplierCompany.id,
    });
    const savedProduct2 = await dataSource.getRepository(Product).save(product2);
    console.log('测试产品已创建');

    // 6. 创建询价单1 - PENDING_QUOTE状态
    const inquiry1 = dataSource.getRepository(Inquiry).create({
      inquiryNo: 'INQ' + Date.now() + '001',
      buyerId: savedBuyerCompany.id,
      supplierId: savedSupplierCompany.id,
      status: InquiryStatus.PENDING_QUOTE,
      details: {
        deliveryLocation: '北京市朝阳区仓库',
        tradeTerms: 'CIF',
        paymentMethod: 'T/T 30天',
        buyerRemarks: '需要提供COA证书，包装要求密封防潮',
      },
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
    });
    const savedInquiry1 = await dataSource.getRepository(Inquiry).save(inquiry1);

    // 为询价单1创建产品明细
    const inquiryItem1 = dataSource.getRepository(InquiryItem).create({
      inquiryId: savedInquiry1.id,
      productId: savedProduct1.id,
      quantity: 1000,
      unit: 'kg',
      packagingReq: '25kg/袋，托盘包装',
      productSnapshot: {
        name: savedProduct1.name,
        pesticideName: savedProduct1.pesticideName,
        formulation: savedProduct1.formulation,
        activeIngredient1: savedProduct1.activeIngredient1,
        totalContent: savedProduct1.totalContent,
      },
    });
    await dataSource.getRepository(InquiryItem).save(inquiryItem1);

    // 为询价单1创建初始消息
    const message1 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry1.id,
      message: '您好，我们需要采购1000kg草甘膦原药，请提供报价和交期。谢谢！',
      senderId: savedBuyerUser.id,
    });
    await dataSource.getRepository(Communication).save(message1);

    console.log('询价单1已创建 (PENDING_QUOTE):', savedInquiry1.id);

    // 7. 创建询价单2 - QUOTED状态  
    const inquiry2 = dataSource.getRepository(Inquiry).create({
      inquiryNo: 'INQ' + Date.now() + '002',
      buyerId: savedBuyerCompany.id,
      supplierId: savedSupplierCompany.id,
      status: InquiryStatus.QUOTED,
      details: {
        deliveryLocation: '北京市朝阳区仓库',
        tradeTerms: 'FOB',
        paymentMethod: 'L/C at sight',
        buyerRemarks: '需要急货，希望15天内发货',
      },
      quoteDetails: {
        totalPrice: 18000,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        supplierRemarks: '价格含包装费，可15天内发货',
      },
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });
    const savedInquiry2 = await dataSource.getRepository(Inquiry).save(inquiry2);

    // 为询价单2创建产品明细
    const inquiryItem2 = dataSource.getRepository(InquiryItem).create({
      inquiryId: savedInquiry2.id,
      productId: savedProduct2.id,
      quantity: 10000,
      unit: 'L',
      packagingReq: '200L/桶',
      productSnapshot: {
        name: savedProduct2.name,
        pesticideName: savedProduct2.pesticideName,
        formulation: savedProduct2.formulation,
        activeIngredient1: savedProduct2.activeIngredient1,
        totalContent: savedProduct2.totalContent,
      },
    });
    await dataSource.getRepository(InquiryItem).save(inquiryItem2);

    // 为询价单2创建消息记录
    const message2_1 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry2.id,
      message: '我需要10000L阿维菌素乳油，请报价。需要急货，15天内能发货吗？',
      senderId: savedBuyerUser.id,
    });
    await dataSource.getRepository(Communication).save(message2_1);

    // 等待1秒再创建下一条消息，确保时间顺序
    await new Promise(resolve => setTimeout(resolve, 1000));

    const message2_2 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry2.id,
      message: '您好，我们可以15天内发货。10000L阿维菌素乳油报价18000美元，包装费已含。有效期15天。',
      senderId: savedSupplierUser.id,
    });
    await dataSource.getRepository(Communication).save(message2_2);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const message2_3 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry2.id,
      message: '价格可以接受，请问支持信用证付款吗？需要提供哪些证书？',
      senderId: savedBuyerUser.id,
    });
    await dataSource.getRepository(Communication).save(message2_3);

    console.log('询价单2已创建 (QUOTED):', savedInquiry2.id);

    // 8. 创建询价单3 - CONFIRMED状态
    const inquiry3 = dataSource.getRepository(Inquiry).create({
      inquiryNo: 'INQ' + Date.now() + '003',
      buyerId: savedBuyerCompany.id,
      supplierId: savedSupplierCompany.id,
      status: InquiryStatus.CONFIRMED,
      details: {
        deliveryLocation: '天津港',
        tradeTerms: 'CIF',
        paymentMethod: 'T/T 30天',
        buyerRemarks: '第二次合作，质量很满意',
      },
      quoteDetails: {
        totalPrice: 95000,
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        supplierRemarks: '老客户价格，质量保证',
      },
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    });
    const savedInquiry3 = await dataSource.getRepository(Inquiry).save(inquiry3);

    // 为询价单3创建产品明细
    const inquiryItem3 = dataSource.getRepository(InquiryItem).create({
      inquiryId: savedInquiry3.id,
      productId: savedProduct1.id,
      quantity: 1000,
      unit: 'kg',
      packagingReq: '25kg/袋，木托盘',
      productSnapshot: {
        name: savedProduct1.name,
        pesticideName: savedProduct1.pesticideName,
        formulation: savedProduct1.formulation,
        activeIngredient1: savedProduct1.activeIngredient1,
        totalContent: savedProduct1.totalContent,
      },
    });
    await dataSource.getRepository(InquiryItem).save(inquiryItem3);

    // 为询价单3创建完整的消息记录
    const message3_1 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry3.id,
      message: '您好，我们想再次采购1000kg草甘膦原药，上次合作很愉快。',
      senderId: savedBuyerUser.id,
    });
    await dataSource.getRepository(Communication).save(message3_1);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const message3_2 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry3.id,
      message: '谢谢信任！老客户价格95000美元，包装按您的要求25kg/袋，木托盘。',
      senderId: savedSupplierUser.id,
    });
    await dataSource.getRepository(Communication).save(message3_2);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const message3_3 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry3.id,
      message: '好的，价格没问题。什么时候能发货？',
      senderId: savedBuyerUser.id,
    });
    await dataSource.getRepository(Communication).save(message3_3);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const message3_4 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry3.id,
      message: '收到定金后3-5个工作日发货，我们马上准备合同。',
      senderId: savedSupplierUser.id,
    });
    await dataSource.getRepository(Communication).save(message3_4);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const message3_5 = dataSource.getRepository(Communication).create({
      relatedService: RelatedService.INQUIRY,
      relatedId: savedInquiry3.id,
      message: '好的，我确认这个订单，请发合同给我。',
      senderId: savedBuyerUser.id,
    });
    await dataSource.getRepository(Communication).save(message3_5);

    console.log('询价单3已创建 (CONFIRMED):', savedInquiry3.id);

    console.log('\n=== 测试数据创建完成 ===');
    console.log('采购商账号: buyer@test.com');
    console.log('供应商账号: supplier@test.com');
    console.log('密码: Test123!');
    console.log(`询价单1 (等待报价): ${savedInquiry1.id}`);
    console.log(`询价单2 (已报价): ${savedInquiry2.id}`);
    console.log(`询价单3 (已确认): ${savedInquiry3.id}`);

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

createTestData();