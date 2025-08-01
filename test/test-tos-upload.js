const TosClient = require('@volcengine/tos-sdk').TosClient;
const fs = require('fs');

async function testTosUpload() {
  console.log('=== 测试TOS上传配置 ===\n');
  
  // 1. 检查环境变量
  console.log('1. 环境变量配置:');
  console.log('TOS_ENDPOINT:', process.env.TOS_ENDPOINT || '未设置');
  console.log('TOS_REGION:', process.env.TOS_REGION || '未设置');
  console.log('TOS_BUCKET:', process.env.TOS_BUCKET || '未设置');
  console.log('VOLC_ACCESS_KEY_ID 长度:', process.env.VOLC_ACCESS_KEY_ID ? process.env.VOLC_ACCESS_KEY_ID.length : 0);
  console.log('VOLC_ACCESS_KEY_SECRET 长度:', process.env.VOLC_ACCESS_KEY_SECRET ? process.env.VOLC_ACCESS_KEY_SECRET.length : 0);
  console.log();
  
  // 2. 尝试不同的endpoint格式
  const endpoints = [
    'tos-cn-shanghai.volces.com',
    'https://tos-cn-shanghai.volces.com',
    'tos-s3-cn-shanghai.volces.com',
    'https://tos-s3-cn-shanghai.volces.com'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n2. 测试endpoint: ${endpoint}`);
    
    try {
      const client = new TosClient({
        accessKeyId: process.env.VOLC_ACCESS_KEY_ID || 'test',
        accessKeySecret: process.env.VOLC_ACCESS_KEY_SECRET || 'test',
        region: process.env.TOS_REGION || 'cn-shanghai',
        endpoint: endpoint,
      });
      
      console.log('✓ TosClient创建成功');
      
      // 尝试简单的API调用
      if (process.env.VOLC_ACCESS_KEY_ID && process.env.VOLC_ACCESS_KEY_SECRET) {
        try {
          // 创建一个小的测试文件
          const testData = Buffer.from('test');
          const result = await client.putObject({
            bucket: process.env.TOS_BUCKET || 'argochainhub',
            key: `test/test-${Date.now()}.txt`,
            body: testData,
            contentType: 'text/plain'
          });
          
          console.log('✓ 上传成功！');
          console.log('  - ETag:', result.headers?.etag);
          console.log('  - RequestId:', result.requestId);
          
          // 成功了，这个endpoint可以使用
          console.log('\n★ 推荐使用此endpoint配置:', endpoint);
          return endpoint;
          
        } catch (uploadError) {
          console.log('✗ 上传失败:', uploadError.message);
          if (uploadError.message.includes('Protocol')) {
            console.log('  → 协议错误，尝试下一个endpoint');
          }
        }
      } else {
        console.log('  (跳过上传测试，因为没有配置访问密钥)');
      }
      
    } catch (error) {
      console.log('✗ TosClient创建失败:', error.message);
    }
  }
  
  console.log('\n\n建议:');
  console.log('1. 检查火山引擎控制台中的TOS服务配置');
  console.log('2. 确认使用的是正确的endpoint地址');
  console.log('3. 火山引擎TOS通常使用不带https://前缀的endpoint');
}

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

// 运行测试
testTosUpload();