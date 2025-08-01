import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PesticidesService } from './pesticides.service';
import { PriceTrendsService } from './price-trends.service';
import { ParsedPriceData, ImageParseResult } from './dto/parse-price-images.dto';
import { CreatePriceTrendDto } from './dto/create-price-trend.dto';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

// 图片解析结果接口
export interface ImageParseResultItem {
  imageIndex: number;
  imageName: string;
  imageUrl: string;
  parsedData: ParsedPriceData[];
  parseStatus: 'success' | 'failed';
  errorMessage?: string;
}

// 任务状态接口
export interface ParseTask {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  totalImages: number;
  processedImages: number;
  totalParsedData: number;
  progress: number;
  imageResults: ImageParseResultItem[];  // 按图片分组的结果
  globalErrors: string[];  // 全局错误（如网络错误等）
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class ImageParseService {
  private readonly logger = new Logger(ImageParseService.name);
  private readonly openRouterApiKey: string;
  private readonly openRouterApiUrl: string;
  private readonly openRouterModel: string;
  
  // 内存任务存储（生产环境应使用Redis）
  private readonly tasks = new Map<string, ParseTask>();

  constructor(
    private readonly configService: ConfigService,
    private readonly pesticidesService: PesticidesService,
    private readonly priceTrendsService: PriceTrendsService,
    private readonly storageService: StorageService,
  ) {
    this.openRouterApiKey = this.configService.get<string>('openrouter.apiKey') || '';
    this.openRouterApiUrl = this.configService.get<string>('openrouter.apiUrl') || 'https://openrouter.ai/api/v1/chat/completions';
    this.openRouterModel = this.configService.get<string>('openrouter.model') || 'openai/gpt-4o';

    if (!this.openRouterApiKey) {
      this.logger.error('OPENROUTER_API_KEY 配置为空或未找到');
      throw new Error('OPENROUTER_API_KEY is not configured');
    }
  }

  /**
   * 创建异步解析任务
   */
  async createParseTask(
    imageFiles: Express.Multer.File[],
    exchangeRate: number
  ): Promise<string> {
    const taskId = uuidv4();
    
    const task: ParseTask = {
      taskId,
      status: 'processing',
      totalImages: imageFiles.length,
      processedImages: 0,
      totalParsedData: 0,
      progress: 0,
      imageResults: imageFiles.map((file, index) => ({
        imageIndex: index + 1,
        imageName: file.originalname,
        imageUrl: '', // 将在处理时填充
        parsedData: [],
        parseStatus: 'success', // 初始状态
      })),
      globalErrors: [],
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);
    
    // 启动异步处理（不等待结果）
    this.processImagesAsync(taskId, imageFiles, exchangeRate).catch(error => {
      this.logger.error(`任务 ${taskId} 处理失败:`, error);
      task.status = 'failed';
      task.globalErrors.push(`任务处理失败: ${error.message}`);
      task.completedAt = new Date();
    });

    return taskId;
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<ParseTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new BadRequestException(`任务 ${taskId} 不存在`);
    }
    return task;
  }

  /**
   * 异步处理图片（只解析，不保存数据库）
   */
  private async processImagesAsync(
    taskId: string,
    imageFiles: Express.Multer.File[],
    exchangeRate: number
  ): Promise<void> {
    const task = this.tasks.get(taskId)!;
    
    try {
      // 处理每张图片
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imageResult = task.imageResults[i];
        
        try {
          this.logger.log(`任务 ${taskId}: 正在解析第 ${i + 1} 张图片: ${file.originalname}`);
          
          // 先上传图片获取URL
          const uploadResult = await this.storageService.uploadFile(
            {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
            1, // 系统用户ID
            'pesticide-price-image'
          );
          
          imageResult.imageUrl = uploadResult.url;
          this.logger.log(`任务 ${taskId}: 第 ${i + 1} 张图片上传成功: ${uploadResult.url}`);
          
          // 解析图片内容
          const parsedData = await this.parseImageWithOpenRouter(file);
          imageResult.parsedData = parsedData;
          imageResult.parseStatus = 'success';
          
          this.logger.log(`任务 ${taskId}: 第 ${i + 1} 张图片解析完成，获得 ${parsedData.length} 条数据`);
          
        } catch (error) {
          const errorMsg = `解析图片 ${file.originalname} 失败: ${error.message}`;
          this.logger.error(`任务 ${taskId}: ${errorMsg}`);
          
          imageResult.parseStatus = 'failed';
          imageResult.errorMessage = errorMsg;
          imageResult.parsedData = []; // 确保失败时数据为空
        }
        
        // 更新整体进度
        task.processedImages = i + 1;
        task.totalParsedData = task.imageResults.reduce((sum, result) => sum + result.parsedData.length, 0);
        task.progress = Math.round((task.processedImages / task.totalImages) * 100);
      }

      // 任务完成
      task.status = 'completed';
      task.completedAt = new Date();
      
      this.logger.log(`任务 ${taskId}: 处理完成，总共解析 ${task.totalParsedData} 条数据`);
      
    } catch (error) {
      task.status = 'failed';
      task.globalErrors.push(`任务处理失败: ${error.message}`);
      task.completedAt = new Date();
      throw error;
    }
  }

  /**
   * 保存用户编辑后的价格数据
   */
  async saveParsedPriceData(saveDataDto: {
    taskId?: string;
    exchangeRate: number;
    priceData: Array<{
      productName: string;
      weekEndDate: string;
      unitPrice: number;
    }>;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      totalItems: number;
      successfulSaves: number;
      failedSaves: number;
      savedData: any[];
      errors: string[];
    }
  }> {
    const { taskId, exchangeRate, priceData } = saveDataDto;
    
    this.logger.log(`开始保存用户编辑的价格数据，共 ${priceData.length} 条${taskId ? `，任务ID: ${taskId}` : ''}`);
    
    if (!priceData || priceData.length === 0) {
      return {
        success: false,
        message: '没有提供要保存的数据',
        data: {
          totalItems: 0,
          successfulSaves: 0,
          failedSaves: 0,
          savedData: [],
          errors: ['没有提供要保存的数据']
        }
      };
    }

    // 转换为标准格式
    const parsedData: ParsedPriceData[] = priceData.map(item => ({
      productName: item.productName,
      weekEndDate: item.weekEndDate,
      unitPrice: item.unitPrice
    }));

    // 使用现有的匹配和保存逻辑
    const saveResults = await this.matchAndSavePriceData(parsedData, exchangeRate);
    
    const response = {
      success: saveResults.success.length > 0,
      message: saveResults.success.length > 0 
        ? `成功保存 ${saveResults.success.length} 条价格数据${saveResults.failed.length > 0 ? `，${saveResults.failed.length} 条保存失败` : ''}`
        : '所有数据保存失败，请检查数据格式和农药名称匹配',
      data: {
        totalItems: priceData.length,
        successfulSaves: saveResults.success.length,
        failedSaves: saveResults.failed.length,
        savedData: saveResults.success,
        errors: saveResults.failed.map(f => f.error)
      }
    };

    // 如果有任务ID，更新任务状态（可选）
    if (taskId && this.tasks.has(taskId)) {
      const task = this.tasks.get(taskId)!;
      // 可以在这里添加保存状态的记录
      this.logger.log(`任务 ${taskId} 的数据已被用户手动保存`);
    }

    this.logger.log(`价格数据保存完成：成功 ${response.data.successfulSaves} 条，失败 ${response.data.failedSaves} 条`);
    
    return response;
  }
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

      // 上传图片到 TOS 存储
      this.logger.log(`开始上传图片到TOS: ${file.originalname}`);
      const uploadResult = await this.storageService.uploadFile(
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        1, // 系统用户ID
        'pesticide-price-image',
      );
      
      const imageUrl = uploadResult.url;
      this.logger.log(`图片上传成功，URL: ${imageUrl}`);
      this.logger.log(`图片信息: ${file.originalname}, 大小: ${file.size} bytes, 类型: ${file.mimetype}`);

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

      // 获取所有农药的中文名称作为参考
      const pesticideNames = await this.pesticidesService.getAllPesticideNames();

      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const prompt = `Analyze this Chinese pesticide price data table image.

请参考以下农药产品库进行产品名称匹配，确保识别的产品名称与库中的名称一致：
${pesticideNames.join('、')}

Extract the following information:
1. Product names from the first column - 请从上述农药库中选择最匹配的名称
2. Time period from the table header  
3. Price data from the right column (second time period)
4. Convert time period to week end date (YYYY-MM-DD format)

IMPORTANT NOTES:
- 产品名称必须严格匹配上述参考库中的名称，如果无法确定匹配，请选择最相似的名称
- 当前年份是 ${currentYear} 年，今天是 ${currentDate}
- 如果图片中的日期显示的是过时的年份，请将年份更新为 ${currentYear}
- 周结束日期应该使用正确的年份 ${currentYear}

Return the data as JSON with this structure:
{
  "priceData": [
    {
      "productName": "product name",
      "weekEndDate": "${currentYear}-MM-DD",
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

      // 使用图片URL调用 OpenRouter API
      this.logger.log('开始发送请求到 OpenRouter API...');
      const response = await fetch(this.openRouterApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: requestBodyStr
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API 请求失败: ${response.status} ${response.statusText}`);
        this.logger.error(`错误详情: ${errorText}`);
        this.logger.error(`请求的图片URL: ${imageUrl}`);
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
   * 匹配农药数据并保存价格数据（优化版本 - 支持批量保存）
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
    
    // 扩展查询名称列表，包含常见的格式变体
    const expandedProductNames = new Set<string>();
    productNames.forEach(name => {
      expandedProductNames.add(name);
      
      // 添加标准化变体
      const normalized = name
        .replace(/[\s\-\.，,]/g, '') // 移除空格、破折号、点、逗号
        .replace(/[()（）]/g, ''); // 移除括号
      expandedProductNames.add(normalized);
      
      // 针对 "2, 4-D" 这种情况，添加特殊处理
      if (name.includes('2, 4-D') || name.includes('2,4-D')) {
        expandedProductNames.add('2,4D');
        expandedProductNames.add('2,4-D');
        expandedProductNames.add('2, 4-D');
      }
    });
    
    const matchedPesticides = await this.pesticidesService.findByProductNames([...expandedProductNames]);

    // 创建产品名称到ID的映射（精确匹配）
    const exactNameToIdMap = new Map<string, number>();
    matchedPesticides.forEach(pesticide => {
      const names = [
        pesticide.productName['zh-CN'],
        pesticide.productName.en,
        pesticide.productName.es
      ].filter(Boolean);
      
      names.forEach(name => {
        exactNameToIdMap.set(name, pesticide.id);
      });
    });

    // 准备批量保存的数据
    const priceTrendsToSave: CreatePriceTrendDto[] = [];
    
    // 处理每条价格数据，先进行匹配验证
    for (const priceData of parsedData) {
      // 首先尝试精确匹配
      let pesticideId = exactNameToIdMap.get(priceData.productName);
      
      // 如果精确匹配失败，尝试模糊匹配
      if (!pesticideId) {
        pesticideId = this.findFuzzyMatch(priceData.productName, matchedPesticides) || undefined;
      }
      
      if (!pesticideId) {
        failed.push({
          data: priceData,
          error: `未找到匹配的农药产品: ${priceData.productName}`
        });
        continue;
      }

      // 添加到批量保存列表
      priceTrendsToSave.push({
        weekEndDate: priceData.weekEndDate,
        unitPrice: priceData.unitPrice,
        exchangeRate: exchangeRate,
        pesticideId: pesticideId
      });
    }

    // 批量保存价格数据（如果有数据需要保存）
    if (priceTrendsToSave.length > 0) {
      try {
        const savedTrends = await this.priceTrendsService.batchCreate(priceTrendsToSave);
        success.push(...savedTrends);
        this.logger.log(`批量保存成功: ${savedTrends.length} 条价格数据`);
      } catch (error) {
        this.logger.error(`批量保存失败: ${error.message}`);
        
        // 如果批量保存失败，回退到逐个保存
        this.logger.log('回退到逐个保存模式');
        for (const priceTrendDto of priceTrendsToSave) {
          try {
            const savedTrend = await this.priceTrendsService.create(priceTrendDto);
            success.push(savedTrend);
          } catch (saveError) {
            // 找到对应的原始数据
            const originalData = parsedData.find(data => {
              // 通过多种方式匹配：精确匹配或者模糊匹配
              const exactMatch = exactNameToIdMap.get(data.productName) === priceTrendDto.pesticideId;
              const fuzzyMatch = this.findFuzzyMatch(data.productName, matchedPesticides) === priceTrendDto.pesticideId;
              
              return (exactMatch || fuzzyMatch) &&
                data.weekEndDate === priceTrendDto.weekEndDate &&
                data.unitPrice === priceTrendDto.unitPrice;
            });
            
            failed.push({
              data: originalData || {
                productName: `ID:${priceTrendDto.pesticideId}的农药`,
                weekEndDate: priceTrendDto.weekEndDate,
                unitPrice: priceTrendDto.unitPrice
              },
              error: `保存价格数据失败: ${saveError.message || '未知错误'}`
            });
          }
        }
      }
    }

    return { success, failed };
  }

  /**
   * 模糊匹配农药名称
   * 处理格式差异，如空格、破折号、标点符号等
   */
  private findFuzzyMatch(searchName: string, pesticides: any[]): number | null {
    // 标准化名称：移除前后空格、破折号、点等标点符号，转为小写
    const normalizeString = (str: string): string => {
      return str
        .trim() // 移除前后空格
        .toLowerCase()
        .replace(/[\s\-\.，,]/g, '') // 移除空格、破折号、点、逗号
        .replace(/[()（）]/g, ''); // 移除括号
    };

    const normalizedSearchName = normalizeString(searchName);
    
    for (const pesticide of pesticides) {
      const names = [
        pesticide.productName['zh-CN'],
        pesticide.productName.en,
        pesticide.productName.es
      ].filter(Boolean);
      
      for (const name of names) {
        const normalizedDbName = normalizeString(name);
        
        // 检查标准化后的名称是否相等
        if (normalizedDbName === normalizedSearchName) {
          this.logger.log(`模糊匹配成功: "${searchName}" -> "${name}" (ID: ${pesticide.id})`);
          return pesticide.id;
        }
        
        // 检查是否包含关系（处理更复杂的情况）
        if (normalizedDbName.includes(normalizedSearchName) || normalizedSearchName.includes(normalizedDbName)) {
          // 如果长度差异不大，认为是匹配的
          const lengthDiff = Math.abs(normalizedDbName.length - normalizedSearchName.length);
          if (lengthDiff <= 2) {
            this.logger.log(`模糊匹配成功(包含): "${searchName}" -> "${name}" (ID: ${pesticide.id})`);
            return pesticide.id;
          }
        }
      }
    }
    
    this.logger.warn(`模糊匹配失败: 未找到与 "${searchName}" 匹配的农药`);
    return null;
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