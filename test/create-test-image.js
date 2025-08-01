const { createCanvas } = require('canvas');
const fs = require('fs');

// 创建一个包含农药价格信息的测试图片
function createTestImage() {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // 白色背景
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 600);

  // 标题
  ctx.fillStyle = 'black';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('农药价格表', 300, 50);

  // 表格标题
  ctx.font = '20px Arial';
  ctx.fillText('产品名称', 50, 120);
  ctx.fillText('规格', 250, 120);
  ctx.fillText('价格(元)', 400, 120);
  ctx.fillText('单位', 550, 120);

  // 画线
  ctx.beginPath();
  ctx.moveTo(40, 140);
  ctx.lineTo(760, 140);
  ctx.stroke();

  // 农药数据
  const pesticides = [
    { name: '阿维菌素', spec: '5% EC', price: '45.00', unit: 'L' },
    { name: '吡虫啉', spec: '70% WG', price: '380.00', unit: 'kg' },
    { name: '多菌灵', spec: '50% WP', price: '28.50', unit: 'kg' },
    { name: '草甘膦', spec: '41% AS', price: '15.80', unit: 'L' },
    { name: '氯氰菊酯', spec: '10% EC', price: '68.00', unit: 'L' }
  ];

  // 填充数据
  ctx.font = '18px Arial';
  pesticides.forEach((item, index) => {
    const y = 180 + index * 40;
    ctx.fillText(item.name, 50, y);
    ctx.fillText(item.spec, 250, y);
    ctx.fillText(item.price, 400, y);
    ctx.fillText(item.unit, 550, y);
  });

  // 日期
  ctx.font = '16px Arial';
  ctx.fillText(`价格日期: ${new Date().toISOString().split('T')[0]}`, 50, 500);
  ctx.fillText('汇率: 1 USD = 6.78 CNY', 50, 530);

  // 保存图片
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync('./test-pesticide-price.jpg', buffer);
  console.log('测试图片已创建: test-pesticide-price.jpg');
}

createTestImage();