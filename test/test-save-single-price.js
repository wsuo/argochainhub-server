const axios = require('axios');

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

// 测试保存单条价格数据
async function testSaveSinglePrice() {
    console.log('=== 测试保存单条价格数据 ===\n');
    
    const token = await getAdminToken();
    console.log('✓ 获取token成功\n');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // 测试保存一条简单的价格数据
    const testData = {
        taskId: "test-task-id",
        exchangeRate: 7.21,
        priceData: [
            {
                productName: "草甘膦",  // 这个肯定存在
                weekEndDate: "2024-01-28",
                unitPrice: 26500
            }
        ]
    };
    
    try {
        console.log('🚀 发送保存请求...');
        console.log('数据:', JSON.stringify(testData, null, 2));
        
        const response = await axios.post(
            `${BASE_URL}/image-parse/save-price-data`,
            testData,
            { headers }
        );
        
        console.log('\n✓ 请求成功！');
        console.log('响应:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('\n❌ 请求失败:');
        console.error('状态码:', error.response?.status);
        console.error('错误信息:', error.response?.data || error.message);
    }
}

// 运行测试
testSaveSinglePrice().catch(console.error);