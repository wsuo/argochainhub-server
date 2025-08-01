const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3050/api/v1/admin';

// 管理员登录获取token
async function getAdminToken() {
    try {
        const response = await axios.post(`${BASE_URL.replace('/admin', '')}/auth/admin/login`, {
            username: 'superadmin',
            password: 'Admin123!'
        });
        return response.data.data.accessToken;
    } catch (error) {
        console.error('登录失败:', error.response?.data || error.message);
        throw error;
    }
}

// 测试新的图片解析流程：解析 -> 预览编辑 -> 保存
async function testNewImageParseWorkflow() {
    console.log('=== 测试新的图片解析工作流程 ===\n');
    
    const token = await getAdminToken();
    console.log('✓ 获取token成功\n');
    
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    // 准备测试图片
    const testImagePath = path.join(__dirname, 'test-pesticide-price.jpg');
    if (!fs.existsSync(testImagePath)) {
        console.error('❌ 测试图片不存在:', testImagePath);
        return;
    }
    
    // === 第一步：提交图片解析任务 ===
    console.log('🚀 第一步：提交图片解析任务...');
    let taskId;
    
    try {
        const formData = new FormData();
        formData.append('images', fs.createReadStream(testImagePath));
        formData.append('exchangeRate', '7.2095');
        
        const response = await axios.post(
            `${BASE_URL}/image-parse/price-data`,
            formData,
            {
                headers: {
                    ...headers,
                    ...formData.getHeaders()
                },
                timeout: 5000 // 5秒超时，应该很快返回
            }
        );
        
        taskId = response.data.data.taskId;
        console.log(`   ✓ 任务创建成功！`);
        console.log(`   任务ID: ${taskId}`);
        console.log(`   待处理图片: ${response.data.data.totalImages} 张`);
        console.log(`   预计时间: ${response.data.data.estimatedTime}`);
        console.log();
        
    } catch (error) {
        console.error(`❌ 任务创建失败:`, error.response?.data || error.message);
        return;
    }
    
    // === 第二步：等待解析完成 ===
    console.log('⏳ 第二步：等待图片解析完成...');
    let parseResults = null;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        try {
            const statusResponse = await axios.get(
                `${BASE_URL}/image-parse/task-status/${taskId}`,
                { headers }
            );
            
            const taskStatus = statusResponse.data.data;
            console.log(`   [${attempts}] 状态: ${taskStatus.status}, 进度: ${taskStatus.progress}%`);
            
            if (taskStatus.status === 'completed') {
                parseResults = taskStatus;
                console.log(`   ✓ 解析完成！总共解析出 ${taskStatus.totalParsedData} 条数据`);
                break;
            } else if (taskStatus.status === 'failed') {
                console.log(`   ❌ 解析失败:`, taskStatus.globalErrors);
                return;
            }
            
            // 等待5秒再检查
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.error(`   状态查询失败: ${error.message}`);
            return;
        }
    }
    
    if (!parseResults) {
        console.log('   ⚠️  解析超时');
        return;
    }
    
    console.log();
    
    // === 第三步：展示按图片分组的解析结果 ===
    console.log('📋 第三步：按图片展示解析结果...');
    
    parseResults.imageResults.forEach((imageResult, index) => {
        console.log(`   📷 图片 ${imageResult.imageIndex}: ${imageResult.imageName}`);
        console.log(`      状态: ${imageResult.parseStatus}`);
        console.log(`      图片URL: ${imageResult.imageUrl}`);
        
        if (imageResult.parseStatus === 'success') {
            console.log(`      解析数据: ${imageResult.parsedData.length} 条`);
            
            // 展示前3条数据作为示例
            imageResult.parsedData.slice(0, 3).forEach((data, idx) => {
                console.log(`        ${idx + 1}. ${data.productName} - $${data.unitPrice} (${data.weekEndDate})`);
            });
            
            if (imageResult.parsedData.length > 3) {
                console.log(`        ... 还有 ${imageResult.parsedData.length - 3} 条数据`);
            }
        } else {
            console.log(`      错误: ${imageResult.errorMessage}`);
        }
        console.log();
    });
    
    // === 第四步：模拟用户编辑数据 ===
    console.log('✏️  第四步：模拟用户编辑解析数据...');
    
    // 收集所有成功解析的数据
    const allParsedData = [];
    parseResults.imageResults.forEach(imageResult => {
        if (imageResult.parseStatus === 'success') {
            allParsedData.push(...imageResult.parsedData);
        }
    });
    
    if (allParsedData.length === 0) {
        console.log('   ❌ 没有成功解析的数据可供编辑');
        return;
    }
    
    // 模拟用户编辑：修改前3条数据的价格
    const editedData = allParsedData.map((data, index) => {
        if (index < 3) {
            // 模拟价格调整
            const adjustedPrice = Math.round((data.unitPrice * 1.05) * 100) / 100; // 涨价5%
            console.log(`   📝 编辑第 ${index + 1} 条: ${data.productName} 价格从 $${data.unitPrice} 调整为 $${adjustedPrice}`);
            return {
                ...data,
                unitPrice: adjustedPrice
            };
        }
        return data;
    });
    
    console.log(`   ✓ 用户编辑完成，共 ${editedData.length} 条数据待保存\\n`);
    
    // === 第五步：保存编辑后的数据 ===
    console.log('💾 第五步：保存用户编辑后的数据...');
    
    try {
        const saveResponse = await axios.post(
            `${BASE_URL}/image-parse/save-price-data`,
            {
                taskId: taskId, // 可选，用于追踪
                exchangeRate: 7.2095,
                priceData: editedData
            },
            { headers }
        );
        
        const saveResult = saveResponse.data.data;
        console.log(`   ✓ 数据保存完成！`);
        console.log(`   总数据: ${saveResult.totalItems} 条`);
        console.log(`   成功保存: ${saveResult.successfulSaves} 条`);
        console.log(`   保存失败: ${saveResult.failedSaves} 条`);
        
        if (saveResult.errors.length > 0) {
            console.log(`   错误信息:`);
            saveResult.errors.slice(0, 3).forEach((error, index) => {
                console.log(`     ${index + 1}. ${error}`);
            });
            if (saveResult.errors.length > 3) {
                console.log(`     ... 还有 ${saveResult.errors.length - 3} 个错误`);
            }
        }
        
    } catch (error) {
        console.error(`❌ 数据保存失败:`, error.response?.data || error.message);
        return;
    }
    
    console.log();
    console.log('🎉 === 新工作流程测试完成 ===');
    console.log('📊 工作流程总结:');
    console.log('  1️⃣  用户上传图片 → 立即获得任务ID（1-2秒响应）');
    console.log('  2️⃣  后台异步解析 → 解析完成但不自动保存');
    console.log('  3️⃣  按图片分组展示解析结果 → 用户可预览每张图片的结果');
    console.log('  4️⃣  用户编辑数据 → 修改产品名称、价格等信息');
    console.log('  5️⃣  用户确认保存 → 数据入库，提供详细保存报告');
    console.log();
    console.log('✨ 优势:');
    console.log('  • 响应速度快，用户体验好');
    console.log('  • 支持数据预览和编辑，准确性高');
    console.log('  • 按图片分组，便于核对和管理');
    console.log('  • 详细的错误反馈，便于问题排查');
}

// 运行测试
testNewImageParseWorkflow().catch(console.error);