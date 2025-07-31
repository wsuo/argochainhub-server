import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PesticidesService } from './pesticides.service';
import { PriceTrendsService } from './price-trends.service';
import { ParsedPriceData, ImageParseResult } from './dto/parse-price-images.dto';
import { CreatePriceTrendDto } from './dto/create-price-trend.dto';

@Injectable()
export class ImageParseService {
  private readonly logger = new Logger(ImageParseService.name);
  private readonly openRouterApiKey: string;
  private readonly openRouterApiUrl: string;
  private readonly openRouterModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly pesticidesService: PesticidesService,
    private readonly priceTrendsService: PriceTrendsService,
  ) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
    this.openRouterApiUrl = this.configService.get<string>('OPENROUTER_API_URL') || 'https://openrouter.ai/api/v1/chat/completions';
    this.openRouterModel = this.configService.get<string>('OPENROUTER_MODEL') || 'openai/gpt-4o';

    if (!this.openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }
  }

  /**
   * 解析图片中的价格数据
   */
  async parseImagesForPriceData(
    imageFiles: Express.Multer.File[],
    exchangeRate: number
  ): Promise<ImageParseResult> {
    if (!imageFiles || imageFiles.length === 0) {
      throw new BadRequestException('没有提供图片文件');
    }

    const allParsedData: ParsedPriceData[] = [];
    const errors: string[] = [];

    // 处理每张图片
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        this.logger.log(`正在解析第 ${i + 1} 张图片: ${file.originalname}`);
        
        const imageData = await this.parseImageWithOpenRouter(file);
        allParsedData.push(...imageData);
        
        this.logger.log(`第 ${i + 1} 张图片解析完成，获得 ${imageData.length} 条数据`);
      } catch (error) {
        const errorMsg = `解析图片 ${file.originalname} 失败: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // 匹配农药数据并保存价格数据
    const savedResults = await this.matchAndSavePriceData(allParsedData, exchangeRate);

    return {
      success: savedResults.success.length > 0,
      data: allParsedData,
      errors: [...errors, ...savedResults.failed.map(f => f.error)]
    };
  }

  /**
   * 使用 OpenRouter API 解析单张图片
   */
  private async parseImageWithOpenRouter(file: Express.Multer.File): Promise<ParsedPriceData[]> {
    try {
      // 验证图片文件
      this.validateImageFile(file);

      // 将图片转换为 base64
      const base64Image = this.convertToBase64(file);
      const mimeType = this.getMimeType(file);
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      this.logger.log(`图片信息: ${file.originalname}, 大小: ${file.size} bytes, 类型: ${mimeType}`);

      // 构建结构化输出的 schema
      const responseSchema = {
        type: 'object',
        properties: {
          priceData: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productName: {
                  type: 'string',
                  description: '产品名称，提取图片中的农药产品名称'
                },
                weekEndDate: {
                  type: 'string',
                  format: 'date',
                  description: '周结束日期，格式为 YYYY-MM-DD'
                },
                unitPrice: {
                  type: 'number',
                  description: '单位价格，提取图片中右侧列的价格数据，单位为元'
                }
              },
              required: ['productName', 'weekEndDate', 'unitPrice']
            }
          }
        },
        required: ['priceData']
      };

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

      // 构建请求体 - 完全按照官方示例
      const requestBody = {
        model: this.openRouterModel,
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

      this.logger.debug(`准备发送OpenRouter API请求，图片URL长度: ${imageUrl.length}`);
      
      let requestBodyStr: string;
      try {
        requestBodyStr = JSON.stringify(requestBody);
        this.logger.debug(`请求体JSON字符串长度: ${requestBodyStr.length}`);
      } catch (jsonError) {
        this.logger.error(`JSON序列化失败: ${jsonError.message}`);
        throw new Error(`请求数据序列化失败: ${jsonError.message}`);
      }

      const response = await fetch(this.openRouterApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://argochainhub.com',
          'X-Title': 'ArgoChainHub Pesticide Price Management System',
          'Content-Type': 'application/json',
        },
        body: requestBodyStr
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API 请求失败: ${response.status} ${response.statusText}`);
        this.logger.error(`错误详情: ${errorText}`);
        this.logger.error(`请求的图片信息: ${file.originalname}, 大小: ${file.size} bytes`);
        throw new Error(`OpenRouter API 请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || result.choices.length === 0) {
        this.logger.error('OpenRouter API 返回空结果');
        this.logger.error(`API响应内容: ${JSON.stringify(result)}`);
        throw new Error('OpenRouter API 返回空结果');
      }

      const content = result.choices[0].message.content;
      this.logger.log(`OpenRouter API 响应内容长度: ${content?.length || 0} 字符`);
      
      if (!content) {
        this.logger.error('OpenRouter API 返回的内容为空');
        throw new Error('OpenRouter API 返回的内容为空');
      }

      let parsedContent;
      try {
        // 处理可能包含markdown代码块标记的响应
        let cleanContent = content;
        if (content.includes('```json')) {
          // 移除markdown代码块标记
          cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
          this.logger.debug('检测到markdown格式JSON响应，已清理格式标记');
        }
        
        parsedContent = JSON.parse(cleanContent);
      } catch (parseError) {
        this.logger.error(`JSON解析失败: ${parseError.message}`);
        this.logger.error(`原始响应内容: ${content}`);
        throw new Error(`API响应JSON解析失败: ${parseError.message}`);
      }
      
      if (!parsedContent.priceData || !Array.isArray(parsedContent.priceData)) {
        this.logger.error('API响应格式不正确，缺少priceData数组');
        this.logger.error(`解析后的内容: ${JSON.stringify(parsedContent)}`);
        throw new Error('API响应格式不正确，缺少价格数据');
      }
      
      this.logger.log(`成功解析图片 ${file.originalname}，获得 ${parsedContent.priceData.length} 条价格数据`);
      return parsedContent.priceData;
      
    } catch (error) {
      // 区分不同类型的错误
      if (error instanceof BadRequestException) {
        // 重新抛出BadRequestException
        throw error;
      }
      
      this.logger.error(`图片 ${file.originalname} 处理过程中发生错误:`);
      this.logger.error(`- 错误类型: ${error.constructor.name}`);
      this.logger.error(`- 错误消息: ${error.message}`);
      this.logger.error(`- 文件信息: 大小=${file.size}bytes, 类型=${file.mimetype}`);
      
      // 网络相关错误
      if (error.message.includes('fetch') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        throw new Error(`网络连接失败，无法访问AI图片解析服务: ${error.message}`);
      }
      
      // API相关错误
      if (error.message.includes('OpenRouter')) {
        throw new Error(`AI图片解析服务错误: ${error.message}`);
      }
      
      // JSON解析错误
      if (error.message.includes('JSON')) {
        throw new Error(`AI服务响应格式错误: ${error.message}`);
      }
      
      // 其他未知错误
      throw new Error(`图片解析失败: ${error.message}`);
    }
  }

  /**
   * 匹配农药数据并保存价格数据
   */
  private async matchAndSavePriceData(
    parsedData: ParsedPriceData[],
    exchangeRate: number
  ): Promise<{
    success: any[];
    failed: { data: ParsedPriceData; error: string }[];
  }> {
    const success: any[] = [];
    const failed: { data: ParsedPriceData; error: string }[] = [];

    // 获取所有产品名称进行批量查询
    const productNames = [...new Set(parsedData.map(item => item.productName))];
    const matchedPesticides = await this.pesticidesService.findByProductNames(productNames);

    // 创建产品名称到ID的映射
    const nameToIdMap = new Map<string, number>();
    matchedPesticides.forEach(pesticide => {
      const names = [
        pesticide.productName['zh-CN'],
        pesticide.productName.en,
        pesticide.productName.es
      ].filter(Boolean);
      
      names.forEach(name => {
        nameToIdMap.set(name, pesticide.id);
      });
    });

    // 处理每条价格数据
    for (const priceData of parsedData) {
      try {
        // 查找匹配的农药ID
        const pesticideId = nameToIdMap.get(priceData.productName);
        
        if (!pesticideId) {
          failed.push({
            data: priceData,
            error: `未找到匹配的农药产品: ${priceData.productName}`
          });
          continue;
        }

        // 创建价格趋势数据
        const createPriceTrendDto: CreatePriceTrendDto = {
          weekEndDate: priceData.weekEndDate,
          unitPrice: priceData.unitPrice,
          exchangeRate: exchangeRate,
          pesticideId: pesticideId
        };

        const savedTrend = await this.priceTrendsService.create(createPriceTrendDto);
        success.push(savedTrend);

      } catch (error) {
        failed.push({
          data: priceData,
          error: error.message || '保存价格数据失败'
        });
      }
    }

    return { success, failed };
  }

  /**
   * 验证图片文件格式和大小
   */
  private validateImageFile(file: Express.Multer.File): void {
    // 检查文件是否存在
    if (!file || !file.buffer) {
      throw new BadRequestException('图片文件为空或损坏');
    }

    // 检查文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(`图片文件过大，最大支持 ${maxSize / 1024 / 1024}MB`);
    }

    // 检查文件缓冲区大小
    if (file.buffer.length === 0) {
      throw new BadRequestException('图片文件内容为空');
    }

    // 获取MIME类型
    const mimeType = this.getMimeType(file);
    
    // 验证支持的图片格式
    const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!supportedFormats.includes(mimeType)) {
      throw new BadRequestException(`不支持的图片格式: ${mimeType}，支持的格式: ${supportedFormats.join(', ')}`);
    }

    // 验证文件头魔数（文件签名）
    this.validateImageMagicNumber(file.buffer, mimeType);
  }

  /**
   * 验证图片文件的魔数（文件签名）
   */
  private validateImageMagicNumber(buffer: Buffer, expectedMimeType: string): void {
    if (buffer.length < 12) {
      throw new BadRequestException('图片文件太小，可能已损坏');
    }

    const firstBytes = buffer.subarray(0, 12);
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (expectedMimeType === 'image/png') {
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (!firstBytes.subarray(0, 8).equals(pngSignature)) {
        throw new BadRequestException('PNG文件格式验证失败，文件可能已损坏');
      }
    }
    // JPEG: FF D8 FF
    else if (expectedMimeType === 'image/jpeg' || expectedMimeType === 'image/jpg') {
      if (firstBytes[0] !== 0xFF || firstBytes[1] !== 0xD8 || firstBytes[2] !== 0xFF) {
        throw new BadRequestException('JPEG文件格式验证失败，文件可能已损坏');
      }
    }
    // GIF: GIF87a 或 GIF89a
    else if (expectedMimeType === 'image/gif') {
      const gif87a = Buffer.from('GIF87a');
      const gif89a = Buffer.from('GIF89a');
      if (!firstBytes.subarray(0, 6).equals(gif87a) && !firstBytes.subarray(0, 6).equals(gif89a)) {
        throw new BadRequestException('GIF文件格式验证失败，文件可能已损坏');
      }
    }
    // WebP: RIFF????WEBP
    else if (expectedMimeType === 'image/webp') {
      const riffSignature = Buffer.from('RIFF');
      const webpSignature = Buffer.from('WEBP');
      if (!firstBytes.subarray(0, 4).equals(riffSignature) || !firstBytes.subarray(8, 12).equals(webpSignature)) {
        throw new BadRequestException('WebP文件格式验证失败，文件可能已损坏');
      }
    }
  }

  /**
   * 获取图片的MIME类型
   */
  private getMimeType(file: Express.Multer.File): string {
    // 优先使用文件的mimetype
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      return file.mimetype;
    }

    // 如果文件的mimetype不是图片类型，直接返回
    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      return file.mimetype;
    }

    // 根据文件扩展名推断
    const extension = file.originalname?.toLowerCase().split('.').pop();
    switch (extension) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        // 如果无法确定类型，返回unknown
        return file.mimetype || 'unknown/unknown';
    }
  }

  /**
   * 将图片转换为base64编码
   */
  private convertToBase64(file: Express.Multer.File): string {
    try {
      // 确保buffer存在且不为空
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('图片文件缓冲区为空');
      }

      this.logger.debug(`开始转换图片 ${file.originalname}，buffer长度: ${file.buffer.length} bytes`);
      this.logger.debug(`图片buffer前16字节: ${Array.from(file.buffer.subarray(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

      // 直接使用Buffer的toString方法进行base64转换
      // 这是最安全的方式，避免字符编码问题
      const base64String = Buffer.from(file.buffer).toString('base64');
      
      // 验证base64编码是否成功
      if (!base64String || base64String.length === 0) {
        throw new Error('base64编码失败');
      }

      // 验证base64格式是否正确（简单检查）
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64String)) {
        this.logger.error(`base64字符串前100字符: ${base64String.substring(0, 100)}`);
        throw new Error('生成的base64字符串格式不正确');
      }

      this.logger.debug(`图片 ${file.originalname} 成功转换为base64，长度: ${base64String.length} 字符`);
      
      return base64String;
      
    } catch (error) {
      this.logger.error(`图片 ${file.originalname} base64转换失败:`);
      this.logger.error(`- 错误消息: ${error.message}`);
      this.logger.error(`- 文件信息: 大小=${file.size}bytes, 类型=${file.mimetype}, 原始名称=${file.originalname}`);
      this.logger.error(`- Buffer信息: 存在=${!!file.buffer}, 长度=${file.buffer?.length || 0}`);
      throw new BadRequestException(`图片base64转换失败: ${error.message}`);
    }
  }
}