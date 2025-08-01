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

// 测试三唑酮匹配
async function testTriadimefonMatch() {
    console.log('=== 测试三唑酮匹配 ===\n');
    
    const token = await getAdminToken();
    console.log('✓ 获取token成功\n');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // 测试保存三唑酮价格数据
    const testData = {
        taskId: "test-triadimefon-match",
        exchangeRate: 7.21,
        priceData: [
            {
                productName: "三唑酮",  // 测试是否能匹配到数据库中的记录
                weekEndDate: "2025-01-28",
                unitPrice: 50000
            }
        ]
    };
    
    try {
        console.log('🚀 测试三唑酮匹配...');
        console.log('数据:', JSON.stringify(testData, null, 2));
        
        const response = await axios.post(
            `${BASE_URL}/image-parse/save-price-data`,
            testData,
            { headers }
        );
        
        console.log('\n✓ 请求成功！');
        console.log('响应:', JSON.stringify(response.data, null, 2));
        
        if (response.data.data.successfulSaves > 0) {
            console.log('\n🎉 三唑酮匹配成功！数据已保存');
        } else {
            console.log('\n❌ 三唑酮匹配失败');
            console.log('错误:', response.data.data.errors);
        }
        
    } catch (error) {
        console.error('\n❌ 请求失败:');
        console.error('状态码:', error.response?.status);
        console.error('错误信息:', error.response?.data || error.message);
    }
}

// 运行测试
testTriadimefonMatch().catch(console.error);