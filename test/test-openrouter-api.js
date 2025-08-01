require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.OPENROUTER_API_KEY;

console.log('=== OpenRouter API Key 验证 ===\n');

if (!apiKey) {
  console.log('❌ OPENROUTER_API_KEY 未设置');
  process.exit(1);
}

console.log('✓ API Key 已设置');
console.log('API Key 长度:', apiKey.length);
console.log('API Key 前缀:', apiKey.substring(0, 10) + '...');

// 测试基本的API调用
async function testOpenRouterAPI() {
  try {
    console.log('\n正在测试 OpenRouter API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ]
      })
    });

    console.log('响应状态:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✓ API调用成功');
      console.log('模型响应:', result.choices?.[0]?.message?.content || '无内容');
    } else {
      const errorText = await response.text();
      console.log('❌ API调用失败');
      console.log('错误详情:', errorText);
      
      if (response.status === 401) {
        console.log('\n可能的原因:');
        console.log('1. API Key 无效或已过期');
        console.log('2. API Key 格式不正确');
        console.log('3. 账户余额不足');
      }
    }
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
  }
}

testOpenRouterAPI();