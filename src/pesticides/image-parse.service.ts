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
    // 将图片转换为 base64
    const base64Image = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/png';
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

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

    const prompt = `
请分析这张图片中的农药价格数据表格。

要求：
1. 提取每行的产品名称（第一列）
2. 提取日期信息（通常在表头或某一列中）
3. 提取右侧列的价格数据（忽略左侧列的价格）
4. 价格单位统一转换为元（如果是分或其他单位请转换）
5. 日期格式化为 YYYY-MM-DD

注意：
- 只关注右侧列的价格数据
- 如果日期信息不清楚，可以根据上下文推断
- 如果产品名称有简称或全称，优先使用常见的标准名称
- 价格数据应为数字，去除货币符号

请按照指定的JSON格式返回数据。
    `;

    try {
      const response = await fetch(this.openRouterApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://argochainhub.com',
          'X-Title': 'ArgoChainHub 农药价格管理系统',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'price_data_extraction',
              schema: responseSchema
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API 请求失败: ${response.status} ${response.statusText}, 响应: ${errorText}`);
        throw new Error(`OpenRouter API 请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.choices || result.choices.length === 0) {
        this.logger.error('OpenRouter API 返回空结果');
        throw new Error('OpenRouter API 返回空结果');
      }

      const content = result.choices[0].message.content;
      this.logger.log(`OpenRouter API 响应内容: ${content}`);
      
      const parsedContent = JSON.parse(content);
      
      return parsedContent.priceData || [];
      
    } catch (error) {
      this.logger.error(`OpenRouter API 调用失败: ${error.message}`);
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
}