const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageParseWithRealImage() {
  try {
    console.log('=== 测试图片解析功能（使用真实农药价格图片）===\n');
    
    // 1. 获取admin token
    console.log('1. 获取admin token...');
    const loginResponse = await axios.post('http://localhost:3050/api/v1/auth/admin/login', {
      username: 'superadmin',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✓ 登录成功，获取到token');
    console.log('Token前缀:', token.substring(0, 20) + '...', '\n');
    
    // 2. 使用系统提供的测试图片或创建一个简单的测试图片
    const testImagePath = path.join(__dirname, 'test-pesticide-price.jpg');
    
    // 如果没有测试图片，创建一个简单的
    if (!fs.existsSync(testImagePath)) {
      console.log('2. 创建测试图片...');
      // 创建一个包含文字的简单JPEG图片
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(400, 300);
      const ctx = canvas.getContext('2d');
      
      // 白色背景
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 400, 300);
      
      // 写入农药价格信息
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('农药价格', 20, 40);
      ctx.font = '16px Arial';
      ctx.fillText('阿维菌素 5%EC: 45元/L', 20, 80);
      ctx.fillText('吡虫啉 70%WG: 380元/kg', 20, 110);
      ctx.fillText('多菌灵 50%WP: 28.5元/kg', 20, 140);
      ctx.fillText('日期: 2025-01-08', 20, 180);
      
      const buffer = canvas.toBuffer('image/jpeg');
      fs.writeFileSync(testImagePath, buffer);
      console.log('✓ 测试图片已创建\n');
    } else {
      console.log('2. 使用现有测试图片\n');
    }
    
    // 3. 调用图片解析接口
    console.log('3. 调用图片解析接口...');
    console.log('图片路径:', testImagePath);
    console.log('图片大小:', fs.statSync(testImagePath).size, 'bytes\n');
    
    const form = new FormData();
    form.append('images', fs.createReadStream(testImagePath));
    form.append('exchangeRate', '6.78');
    
    const startTime = Date.now();
    const response = await axios.post(
      'http://localhost:3050/api/v1/admin/image-parse/price-data',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const endTime = Date.now();
    
    console.log('✓ 图片解析成功！');
    console.log(`耗时: ${endTime - startTime}ms\n`);
    
    // 4. 展示解析结果
    console.log('=== 解析结果 ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 5. 如果是测试模式，展示测试结果分析
    if (response.data.data && response.data.data.isTestMode) {
      console.log('\n⚠️  当前为测试模式（模拟数据）');
    } else {
      console.log('\n✓ 成功调用OpenRouter API进行图片解析');
      
      // 展示解析出的农药价格
      if (response.data.data && response.data.data.items && response.data.data.items.length > 0) {
        console.log('\n解析出的农药价格:');
        response.data.data.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.productName} (${item.specification})`);
          console.log(`   价格: ${item.price} 元/${item.unit}`);
          console.log(`   USD价格: ${item.priceUSD}`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
      
      // 如果是500错误，可能是服务端错误
      if (error.response.status === 500) {
        console.error('\n可能的原因:');
        console.error('1. OpenRouter API密钥无效');
        console.error('2. 图片上传到OSS失败');
        console.error('3. OpenRouter API调用失败');
        console.error('\n请检查服务器日志获取详细错误信息');
      }
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 运行测试
testImageParseWithRealImage();