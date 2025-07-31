const fs = require('fs');
const path = require('path');

// 模拟官方代码示例
async function testImageParsing() {
  console.log('开始测试图片解析...');
  
  try {
    // 读取图片文件
    const imagePath = path.join(__dirname, 'test/small-test.png');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`图片文件不存在: ${imagePath}`);
    }
    
    console.log(`读取图片文件: ${imagePath}`);
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`图片大小: ${imageBuffer.length} bytes`);
    
    // 转换为base64
    const base64Image = imageBuffer.toString('base64');
    console.log(`Base64长度: ${base64Image.length} 字符`);
    
    // 构建data URL
    const imageUrl = `data:image/png;base64,${base64Image}`;
    console.log(`图片URL长度: ${imageUrl.length} 字符`);
    
    // 构建请求提示词（英文版本）
    const prompt = `Analyze this Chinese pesticide price data table image.

Extract the following information:
1. Product names from the first column
2. Time period from the table header  
3. Price data from the right column (second time period)
4. Convert time period to week end date (YYYY-MM-DD format)

Return the data as JSON with this structure:
{
  "priceData": [
    {
      "productName": "product name",
      "weekEndDate": "2024-07-18",
      "unitPrice": 12000
    }
  ]
}`;

    // 构建请求体（完全按照官方示例）
    const requestBody = {
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    };

    console.log('构建请求体完成');
    
    // 序列化请求体（这里是之前出错的地方）
    let requestBodyStr;
    try {
      requestBodyStr = JSON.stringify(requestBody);
      console.log(`请求体JSON字符串长度: ${requestBodyStr.length}`);
      console.log('JSON序列化成功 ✓');
    } catch (jsonError) {
      console.error(`JSON序列化失败: ${jsonError.message}`);
      throw new Error(`请求数据序列化失败: ${jsonError.message}`);
    }

    // 发送请求到OpenRouter API
    console.log('准备发送请求到OpenRouter API...');
    
    const apiKey = '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';
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://argochainhub.com',
        'X-Title': 'ArgoChainHub Pesticide Price Management System',
        'Content-Type': 'application/json',
      },
      body: requestBodyStr
    });

    console.log(`API响应状态: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API请求失败: ${response.status} ${response.statusText}`);
      console.error(`错误详情: ${errorText}`);
      throw new Error(`OpenRouter API 请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API请求成功 ✓');
    
    if (!result.choices || result.choices.length === 0) {
      console.error('API返回空结果');
      console.error(`API响应内容: ${JSON.stringify(result)}`);
      throw new Error('OpenRouter API 返回空结果');
    }

    const content = result.choices[0].message.content;
    console.log(`API响应内容长度: ${content?.length || 0} 字符`);
    
    if (!content) {
      console.error('API返回的内容为空');
      throw new Error('OpenRouter API 返回的内容为空');
    }

    // 解析JSON响应
    let parsedContent;
    try {
      // 处理可能包含markdown代码块标记的响应
      let cleanContent = content;
      if (content.includes('```json')) {
        // 移除markdown代码块标记
        cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      }
      
      parsedContent = JSON.parse(cleanContent);
      console.log('响应JSON解析成功 ✓');
    } catch (parseError) {
      console.error(`JSON解析失败: ${parseError.message}`);
      console.error(`原始响应内容: ${content}`);
      throw new Error(`API响应JSON解析失败: ${parseError.message}`);
    }
    
    if (!parsedContent.priceData || !Array.isArray(parsedContent.priceData)) {
      console.error('API响应格式不正确，缺少priceData数组');
      console.error(`解析后的内容: ${JSON.stringify(parsedContent)}`);
      throw new Error('API响应格式不正确，缺少价格数据');
    }
    
    console.log(`成功解析图片，获得 ${parsedContent.priceData.length} 条价格数据`);
    console.log('解析结果:');
    console.log(JSON.stringify(parsedContent, null, 2));
    
    console.log('\n✅ 测试成功！Base64编码错误已修复！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(`错误类型: ${error.constructor.name}`);
    console.error(`错误消息: ${error.message}`);
    
    // 区分不同类型的错误
    if (error.message.includes('Cannot convert argument to a ByteString')) {
      console.error('\n🔍 分析: 这是原始的ByteString编码错误，说明修复没有生效');
    } else if (error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
      console.error('\n🔍 分析: 网络连接问题');
    } else if (error.message.includes('JSON')) {
      console.error('\n🔍 分析: JSON处理问题');
    } else if (error.message.includes('OpenRouter')) {
      console.error('\n🔍 分析: OpenRouter API相关问题');
    }
    
    process.exit(1);
  }
}

// 运行测试
testImageParsing().catch(console.error);