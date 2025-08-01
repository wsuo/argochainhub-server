// 测试代理环境变量
console.log('=== 代理环境变量检测 ===\n');

console.log('HTTP_PROXY:', process.env.HTTP_PROXY || '未设置');
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || '未设置');
console.log('http_proxy:', process.env.http_proxy || '未设置');
console.log('https_proxy:', process.env.https_proxy || '未设置');
console.log('NO_PROXY:', process.env.NO_PROXY || '未设置');
console.log('no_proxy:', process.env.no_proxy || '未设置');
console.log('ALL_PROXY:', process.env.ALL_PROXY || '未设置');
console.log('all_proxy:', process.env.all_proxy || '未设置');

console.log('\n如果您正在使用终端代理，建议:');
console.log('1. 临时禁用代理来运行服务器:');
console.log('   unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy');
console.log('\n2. 或者将火山引擎域名添加到 NO_PROXY:');
console.log('   export NO_PROXY="localhost,127.0.0.1,.volces.com,.volcengine.com"');
console.log('\n3. 在 .env.local 中配置 NO_PROXY（如果TOS SDK支持）');