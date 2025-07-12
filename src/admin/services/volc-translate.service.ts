import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto-js';
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
  private readonly accessKeySecret: string;
  private readonly region: string = 'cn-north-1';
  private readonly service: string = 'translate';
  private readonly host: string = 'translate.volcengineapi.com';
  private readonly cacheTTL: number;
  private readonly rateLimit: number;

  constructor(private readonly configService: ConfigService) {
    this.accessKeyId = this.configService.get<string>('VOLC_ACCESS_KEY_ID')!;
    this.accessKeySecret = this.configService.get<string>('VOLC_ACCESS_KEY_SECRET')!;
    this.cacheTTL = this.configService.get<number>('TRANSLATE_CACHE_TTL', 86400); // 24小时
    this.rateLimit = this.configService.get<number>('TRANSLATE_RATE_LIMIT', 100); // 每分钟100次

    if (!this.accessKeyId || !this.accessKeySecret) {
      throw new Error('火山引擎配置缺失：VOLC_ACCESS_KEY_ID 和 VOLC_ACCESS_KEY_SECRET 必须配置');
    }

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
      // 准备请求参数
      const requestBody = {
        TextList: [text],
        TargetLanguage: toVolcLanguageCode(target_lang),
        ...(source_lang && { SourceLanguage: toVolcLanguageCode(source_lang) }),
      };

      // 调用火山引擎API
      const response = await this.callVolcApi('TranslateText', requestBody);

      if (response.ResponseMetadata.Error) {
        throw new BadRequestException(`翻译失败: ${response.ResponseMetadata.Error.Message}`);
      }

      if (!response.TranslationList || response.TranslationList.length === 0) {
        throw new InternalServerErrorException('翻译服务返回空结果');
      }

      const translatedText = response.TranslationList[0].Translation;

      // 保存到缓存
      await this.saveToCache(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      this.logger.error('翻译请求失败', error);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('翻译服务不可用');
    }
  }

  /**
   * 检测语言
   */
  async detectLanguage(detectionDto: LanguageDetectionDto): Promise<{ language: SupportedLanguage; confidence: number }> {
    const { text } = detectionDto;

    try {
      const requestBody = {
        TextList: [text],
      };

      const response = await this.callVolcApi('LangDetect', requestBody);

      if (response.ResponseMetadata.Error) {
        throw new BadRequestException(`语言检测失败: ${response.ResponseMetadata.Error.Message}`);
      }

      if (!response.DetectedLanguageList || response.DetectedLanguageList.length === 0) {
        throw new InternalServerErrorException('语言检测服务返回空结果');
      }

      const detection = response.DetectedLanguageList[0];
      const systemLang = toSystemLanguageCode(detection.Language as any);

      return {
        language: systemLang,
        confidence: detection.Confidence,
      };
    } catch (error) {
      this.logger.error('语言检测请求失败', error);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('语言检测服务不可用');
    }
  }

  /**
   * 调用火山引擎API
   */
  private async callVolcApi(action: string, body: any): Promise<VolcApiResponse> {
    const url = `https://${this.host}/`;
    const method = 'POST';
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyStr = JSON.stringify(body);

    // 生成签名
    const authorization = this.generateSignature(method, '/', bodyStr, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authorization,
      'X-Date': new Date(timestamp * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    };

    const response = await fetch(url, {
      method,
      headers,
      body: bodyStr,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 生成火山引擎API v4签名
   */
  private generateSignature(method: string, path: string, body: string, timestamp: number): string {
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const dateTime = new Date(timestamp * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

    // 1. 创建规范请求
    const canonicalHeaders = [
      `content-type:application/json`,
      `host:${this.host}`,
      `x-date:${dateTime}`,
    ].join('\n');

    const signedHeaders = 'content-type;host;x-date';
    const hashedPayload = crypto.SHA256(body).toString(crypto.enc.Hex);

    const canonicalRequest = [
      method,
      path,
      '', // query string
      canonicalHeaders,
      '', // 空行
      signedHeaders,
      hashedPayload,
    ].join('\n');

    // 2. 创建待签名字符串
    const algorithm = 'HMAC-SHA256';
    const credentialScope = `${date}/${this.region}/${this.service}/request`;
    const hashedCanonicalRequest = crypto.SHA256(canonicalRequest).toString(crypto.enc.Hex);

    const stringToSign = [
      algorithm,
      dateTime,
      credentialScope,
      hashedCanonicalRequest,
    ].join('\n');

    // 3. 计算签名
    const kDate = crypto.HmacSHA256(date, this.accessKeySecret);
    const kRegion = crypto.HmacSHA256(this.region, kDate);
    const kService = crypto.HmacSHA256(this.service, kRegion);
    const kSigning = crypto.HmacSHA256('request', kService);
    const signature = crypto.HmacSHA256(stringToSign, kSigning).toString(crypto.enc.Hex);

    // 4. 生成Authorization头
    return `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
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