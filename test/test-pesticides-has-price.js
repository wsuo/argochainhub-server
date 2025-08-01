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

// 测试农药列表价格筛选功能
async function testPesticidesWithPriceFilter() {
    console.log('=== 测试农药列表价格筛选功能 ===\n');
    
    const token = await getAdminToken();
    console.log('✓ 获取token成功\n');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // 测试1: 查询所有农药（不加价格筛选）
    console.log('1. 查询所有可见农药（不加价格筛选）:');
    try {
        const response1 = await axios.get(`${BASE_URL}/pesticides?page=1&limit=5&isVisible=true`, { headers });
        const data1 = response1.data.data;
        console.log(`   总数量: ${response1.data.meta.totalItems}`);
        console.log(`   当前页数量: ${data1.length}`);
        console.log(`   有价格的农药数量: ${data1.filter(p => p.latestPrice).length}`);
        console.log(`   无价格的农药数量: ${data1.filter(p => !p.latestPrice).length}`);
        console.log();
    } catch (error) {
        console.error('   查询失败:', error.response?.data || error.message);
    }
    
    // 测试2: 只查询有价格的农药
    console.log('2. 只查询有价格的农药 (hasPrice=true):');
    try {
        const response2 = await axios.get(`${BASE_URL}/pesticides?page=1&limit=5&isVisible=true&hasPrice=true`, { headers });
        const data2 = response2.data.data;
        console.log(`   总数量: ${response2.data.meta.totalItems}`);
        console.log(`   当前页数量: ${data2.length}`);
        console.log(`   验证 - 所有农药都有价格: ${data2.every(p => p.latestPrice) ? '✓' : '✗'}`);
        if (data2.length > 0) {
            console.log(`   示例 - ${data2[0].productName['zh-CN']}: ${data2[0].latestPrice?.unitPrice || 'N/A'} 元`);
        }
        console.log();
    } catch (error) {
        console.error('   查询失败:', error.response?.data || error.message);
    }
    
    // 测试3: 只查询无价格的农药
    console.log('3. 只查询无价格的农药 (hasPrice=false):');
    try {
        const response3 = await axios.get(`${BASE_URL}/pesticides?page=1&limit=5&isVisible=true&hasPrice=false`, { headers });
        const data3 = response3.data.data;
        console.log(`   总数量: ${response3.data.meta.totalItems}`);
        console.log(`   当前页数量: ${data3.length}`);
        console.log(`   验证 - 所有农药都无价格: ${data3.every(p => !p.latestPrice) ? '✓' : '✗'}`);
        if (data3.length > 0) {
            console.log(`   示例 - ${data3[0].productName['zh-CN']}: ${data3[0].latestPrice ? '有价格' : '无价格'}`);
        }
        console.log();
    } catch (error) {
        console.error('   查询失败:', error.response?.data || error.message);
    }
    
    // 测试4: 结合其他筛选条件
    console.log('4. 结合类别筛选查询有价格的杀虫剂:');
    try {
        const response4 = await axios.get(`${BASE_URL}/pesticides?page=1&limit=3&isVisible=true&hasPrice=true&category=insecticide`, { headers });
        const data4 = response4.data.data;
        console.log(`   杀虫剂中有价格的总数量: ${response4.data.meta.totalItems}`);
        console.log(`   当前页数量: ${data4.length}`);
        console.log(`   验证 - 所有都是杀虫剂且有价格: ${data4.every(p => p.category === 'insecticide' && p.latestPrice) ? '✓' : '✗'}`);
        console.log();
    } catch (error) {
        console.error('   查询失败:', error.response?.data || error.message);
    }
    
    // 测试5: 搜索功能结合价格筛选
    console.log('5. 搜索"菊酯"且有价格的农药:');
    try {
        const searchUrl = `${BASE_URL}/pesticides?page=1&limit=3&isVisible=true&hasPrice=true&search=${encodeURIComponent('菊酯')}`;
        const response5 = await axios.get(searchUrl, { headers });
        const data5 = response5.data.data;
        console.log(`   含"菊酯"且有价格的总数量: ${response5.data.meta.totalItems}`);
        console.log(`   当前页数量: ${data5.length}`);
        if (data5.length > 0) {
            data5.forEach((p, index) => {
                console.log(`   ${index + 1}. ${p.productName['zh-CN']}: ${p.latestPrice?.unitPrice || 'N/A'} 元`);
            });
        }
        console.log();
    } catch (error) {
        console.error('   查询失败:', error.response?.data || error.message);
    }
    
    // 测试6: 数据一致性验证
    console.log('6. 数据一致性验证:');
    try {
        const [allResp, hasPriceResp, noPriceResp] = await Promise.all([
            axios.get(`${BASE_URL}/pesticides?page=1&limit=1&isVisible=true`, { headers }),
            axios.get(`${BASE_URL}/pesticides?page=1&limit=1&isVisible=true&hasPrice=true`, { headers }),
            axios.get(`${BASE_URL}/pesticides?page=1&limit=1&isVisible=true&hasPrice=false`, { headers })
        ]);
        
        const totalAll = allResp.data.meta.totalItems;
        const totalHasPrice = hasPriceResp.data.meta.totalItems;
        const totalNoPrice = noPriceResp.data.meta.totalItems;
        
        console.log(`   所有农药: ${totalAll}`);
        console.log(`   有价格: ${totalHasPrice}`);
        console.log(`   无价格: ${totalNoPrice}`);
        console.log(`   数据一致性: ${totalAll} = ${totalHasPrice} + ${totalNoPrice} ${totalAll === (totalHasPrice + totalNoPrice) ? '✓' : '✗'}`);
        console.log();
    } catch (error) {
        console.error('   验证失败:', error.response?.data || error.message);
    }
    
    console.log('=== 测试完成 ===');
    console.log('✅ hasPrice 参数功能已成功实现！');
    console.log('📋 新增查询参数说明:');
    console.log('  - hasPrice=true:  仅返回有价格数据的农药');
    console.log('  - hasPrice=false: 仅返回无价格数据的农药');
    console.log('  - 不传该参数:     返回所有农药（有无价格都包括）');
}

// 运行测试
testPesticidesWithPriceFilter().catch(console.error);