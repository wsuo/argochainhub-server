const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageParse() {
  try {
    // 1. 获取admin token
    console.log('1. 获取admin token...');
    const loginResponse = await axios.post('http://localhost:3050/api/v1/auth/admin/login', {
      username: 'superadmin',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ 登录成功，获取到token');
    
    // 2. 准备测试图片
    const testImagePath = path.join(__dirname, 'test-pesticide-price.jpg');
    
    // 创建一个简单的测试图片（如果不存在）
    if (!fs.existsSync(testImagePath)) {
      console.log('\n2. 创建测试图片...');
      // 这里应该使用一个真实的农药价格图片
      // 为了测试，我们先检查是否有真实图片
      console.log('⚠️  请提供一个包含农药价格信息的真实图片文件: test-pesticide-price.jpg');
      return;
    }
    
    // 3. 调用图片解析接口
    console.log('\n3. 调用图片解析接口...');
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
    console.log(`耗时: ${endTime - startTime}ms`);
    console.log('\n解析结果:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 运行测试
testImageParse();