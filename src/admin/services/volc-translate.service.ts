import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto-js';
import { Signer } from '@volcengine/openapi';
import { TranslateRequestDto, LanguageDetectionDto } from '../dto/translate.dto';
import { toVolcLanguageCode, toSystemLanguageCode, SupportedLanguage } from '../../common/utils/language-mapper';

interface VolcApiResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: {
      Code: string;
      Message: string;
    };
  };
  TranslationList?: Array<{
    Translation: string;
    DetectedSourceLanguage?: string;
  }>;
  DetectedLanguageList?: Array<{
    Language: string;
    Confidence: number;
  }>;
}

@Injectable()
export class VolcTranslateService {
  private readonly logger = new Logger(VolcTranslateService.name);
  private redis: Redis | null;
  private readonly accessKeyId: string;
  private readonly secretKey: string;
  private readonly region: string = 'cn-beijing';
  private readonly host: string = 'open.volcengineapi.com';
  private readonly cacheTTL: number;
  private readonly rateLimit: number;

  constructor(private readonly configService: ConfigService) {
    this.accessKeyId = this.configService.get<string>('VOLC_ACCESS_KEY_ID')!;
    this.secretKey = this.configService.get<string>('VOLC_ACCESS_KEY_SECRET')!;
    
    this.cacheTTL = this.configService.get<number>('TRANSLATE_CACHE_TTL', 86400); // 24小时
    this.rateLimit = this.configService.get<number>('TRANSLATE_RATE_LIMIT', 100); // 每分钟100次

    if (!this.accessKeyId || !this.secretKey) {
      throw new Error('火山引擎配置缺失：VOLC_ACCESS_KEY_ID 和 VOLC_ACCESS_KEY_SECRET 必须配置');
    }

    this.logger.log('火山引擎翻译服务初始化成功', {
      keyId: this.accessKeyId.substring(0, 10) + '...',
      secretLength: this.secretKey.length,
      region: this.region
    });

    // 初始化Redis连接
    this.initRedis();
  }

  private initRedis() {
    try {
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        maxRetriesPerRequest: 3,
      });

      this.logger.log('Redis连接初始化成功');
    } catch (error) {
      this.logger.error('Redis连接初始化失败', error);
      // 如果Redis连接失败，设置为null，服务将不使用缓存
      this.redis = null;
    }
  }

  /**
   * 翻译文本
   */
  async translateText(translateDto: TranslateRequestDto): Promise<string> {
    const { text, source_lang, target_lang } = translateDto;

    // 检查缓存
    const cacheKey = this.generateCacheKey(text, source_lang, target_lang);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`翻译缓存命中: ${text.substring(0, 50)}...`);
      return cached;
    }

    // 检查速率限制
    await this.checkRateLimit();

    try {
      this.logger.debug('发送翻译请求:', { 
        textLength: text.length, 
        sourceLang: source_lang, 
        targetLang: target_lang 
      });

      // 调用火山引擎翻译API
      const response = await this.callTranslateApi([text], source_lang, target_lang);

      this.logger.debug('收到翻译响应:', { 
        requestId: response.ResponseMetadata?.RequestId,
        hasTranslations: !!response.TranslationList?.length 
      });

      if (!response.TranslationList || response.TranslationList.length === 0) {
        throw new InternalServerErrorException('翻译服务返回空结果');
      }

      const translatedText = response.TranslationList[0].Translation;
      this.logger.debug('翻译成功:', { 
        original: text.substring(0, 50), 
        translated: translatedText.substring(0, 50) 
      });

      // 保存到缓存
      await this.saveToCache(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      this.logger.error('翻译请求失败:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`翻译服务不可用: ${error.message}`);
    }
  }

  /**
   * 检测语言
   */
  async detectLanguage(detectionDto: LanguageDetectionDto): Promise<{ language: SupportedLanguage; confidence: number }> {
    const { text } = detectionDto;

    try {
      this.logger.debug('发送语言检测请求:', { textLength: text.length });

      const response = await this.callDetectApi([text]);

      this.logger.debug('收到语言检测响应:', { 
        requestId: response.ResponseMetadata?.RequestId,
        hasDetections: !!response.DetectedLanguageList?.length 
      });

      if (!response.DetectedLanguageList || response.DetectedLanguageList.length === 0) {
        throw new InternalServerErrorException('语言检测服务返回空结果');
      }

      const detection = response.DetectedLanguageList[0];
      const systemLang = toSystemLanguageCode(detection.Language as any);

      this.logger.debug('语言检测成功:', { 
        detected: detection.Language, 
        mapped: systemLang, 
        confidence: detection.Confidence 
      });

      return {
        language: systemLang,
        confidence: detection.Confidence,
      };
    } catch (error) {
      this.logger.error('语言检测请求失败:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`语言检测服务不可用: ${error.message}`);
    }
  }

  /**
   * 调用翻译API
   */
  private async callTranslateApi(textList: string[], sourceLang?: string, targetLang?: string): Promise<VolcApiResponse> {
    try {
      // 准备请求体
      const requestBody: any = {
        TargetLanguage: toVolcLanguageCode(targetLang! as SupportedLanguage),
        TextList: textList
      };

      if (sourceLang) {
        requestBody.SourceLanguage = toVolcLanguageCode(sourceLang as SupportedLanguage);
      }

      this.logger.debug('发送翻译API请求:', { 
        textCount: textList.length,
        targetLang: requestBody.TargetLanguage,
        sourceLang: requestBody.SourceLanguage 
      });

      const response = await this.callVolcApi('TranslateText', requestBody);
      return response;
    } catch (error) {
      this.logger.error('callTranslateApi执行失败:', error);
      throw error;
    }
  }

  /**
   * 调用语言检测API
   */
  private async callDetectApi(textList: string[]): Promise<VolcApiResponse> {
    try {
      const requestBody = {
        TextList: textList
      };

      this.logger.debug('发送语言检测API请求:', { 
        textCount: textList.length
      });

      const response = await this.callVolcApi('LangDetect', requestBody);
      return response;
    } catch (error) {
      this.logger.error('callDetectApi执行失败:', error);
      throw error;
    }
  }

  /**
   * 使用官方SDK调用火山引擎API
   */
  private async callVolcApi(action: string, body: any): Promise<VolcApiResponse> {
    try {
      // 准备请求参数（按照官方示例格式）
      const openApiRequestData = {
        method: "POST" as const,
        region: this.region,
        params: {
          Action: action,
          Version: '2020-06-01'
        }
      };

      const credentials = {
        accessKeyId: this.accessKeyId,
        secretKey: this.secretKey,
        sessionToken: ""
      };

      // 使用官方SDK进行签名
      const signer = new Signer(openApiRequestData, 'translate');
      
      // 使用Query签名方式（按照官方示例）
      const signedQueryString = signer.getSignUrl(credentials);

      // 构建完整URL
      const url = `https://${this.host}/?${signedQueryString}`;

      this.logger.debug('发送火山引擎API请求:', { 
        url: url.substring(0, 200) + '...',
        action,
        bodyLength: JSON.stringify(body).length
      });

      // 发送HTTP请求
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const responseText = await response.text();
      
      this.logger.debug('收到火山引擎API响应:', { 
        status: response.status, 
        statusText: response.statusText,
        bodyLength: responseText.length 
      });

      if (!response.ok) {
        this.logger.error('火山引擎API请求失败:', { 
          status: response.status, 
          statusText: response.statusText,
          body: responseText.substring(0, 500)
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      
      // 检查API错误
      if (result.ResponseMetadata?.Error) {
        throw new BadRequestException(`火山引擎API错误: ${result.ResponseMetadata.Error.Message} (Code: ${result.ResponseMetadata.Error.Code})`);
      }

      return result;
    } catch (error) {
      this.logger.error('callVolcApi执行失败:', error);
      throw error;
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(text: string, sourceLang?: string, targetLang?: string): string {
    const key = `${text}|${sourceLang || 'auto'}|${targetLang}`;
    return `translate:${crypto.MD5(key).toString()}`;
  }

  /**
   * 从缓存获取
   */
  private async getFromCache(key: string): Promise<string | null> {
    if (!this.redis) return null;

    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.warn('缓存读取失败', error);
      return null;
    }
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(key: string, value: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, this.cacheTTL, value);
    } catch (error) {
      this.logger.warn('缓存保存失败', error);
    }
  }

  /**
   * 检查速率限制
   */
  private async checkRateLimit(): Promise<void> {
    if (!this.redis) return;

    const key = 'translate:rate_limit';
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, 60); // 60秒窗口
      }

      if (current > this.rateLimit) {
        throw new BadRequestException('翻译请求过于频繁，请稍后再试');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn('速率限制检查失败', error);
    }
  }
}