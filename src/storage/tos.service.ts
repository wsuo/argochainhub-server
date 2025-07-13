import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TosClient, TosClientError, TosServerError, DataTransferType } from '@volcengine/tos-sdk';
import * as fs from 'fs';

export interface TosConfig {
  region: string;
  endpoint: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  sessionToken?: string;
  requestTimeout: number;
  cdnDomain?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag: string;
  size: number;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  etag: string;
}

export interface UploadProgress {
  type: 'started' | 'progress' | 'completed' | 'failed';
  totalBytes: number;
  consumedBytes: number;
  percentage: number;
}

@Injectable()
export class TosService {
  private readonly logger = new Logger(TosService.name);
  private readonly tosClient: TosClient;
  private readonly config: TosConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<TosConfig>('tos')!;

    // 按照官方文档初始化TOS客户端
    this.tosClient = new TosClient({
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      region: this.config.region,
      endpoint: this.config.endpoint,
      requestTimeout: this.config.requestTimeout,
    });

    this.logger.log(`TOS client initialized for bucket: ${this.config.bucket}`);
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    try {
      const response = await this.tosClient.putObject({
        bucket: this.config.bucket,
        key: key,
        body: buffer,
        contentType: contentType,
        meta: metadata,
      });

      const url = this.getFileUrl(key);

      return {
        key,
        url,
        bucket: this.config.bucket,
        etag: response.headers?.etag || '',
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}:`, error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async uploadFileFromPath(
    key: string,
    filePath: string,
    contentType: string,
    metadata?: Record<string, string>,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    try {
      // 获取文件大小
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      this.logger.log(`Starting upload: ${key} (${fileSize} bytes)`);

      // 使用官方文档的putObjectFromFile方法
      const response = await this.tosClient.putObjectFromFile({
        bucket: this.config.bucket,
        key: key,
        filePath: filePath,
        contentType: contentType,
        // 自定义元数据
        meta: metadata,
        // 进度回调
        dataTransferStatusChange: (event) => {
          if (onProgress) {
            let progressType: UploadProgress['type'];
            let percentage = 0;

            switch (event.type) {
              case DataTransferType.Started:
                progressType = 'started';
                this.logger.log(`Upload started: ${key}`);
                break;
              case DataTransferType.Rw:
                progressType = 'progress';
                percentage = event.totalBytes > 0 
                  ? Math.round((event.consumedBytes / event.totalBytes) * 100)
                  : 0;
                
                // 只记录关键进度节点
                if (percentage % 25 === 0) {
                  this.logger.log(`Upload progress ${key}: ${percentage}%`);
                }
                break;
              case DataTransferType.Succeed:
                progressType = 'completed';
                percentage = 100;
                this.logger.log(`Upload completed: ${key}`);
                break;
              case DataTransferType.Failed:
                progressType = 'failed';
                this.logger.error(`Upload failed: ${key}`);
                break;
              default:
                progressType = 'progress';
            }

            onProgress({
              type: progressType,
              totalBytes: event.totalBytes || fileSize,
              consumedBytes: event.consumedBytes || 0,
              percentage,
            });
          }
        },
      });

      const url = this.getFileUrl(key);

      return {
        key,
        url,
        bucket: this.config.bucket,
        etag: response.headers?.etag || '',
        size: fileSize,
      };
    } catch (error) {
      // 上传失败回调
      if (onProgress) {
        onProgress({
          type: 'failed',
          totalBytes: 0,
          consumedBytes: 0,
          percentage: 0,
        });
      }
      
      // 使用官方推荐的错误处理方式
      this.handleTosError(error, `Upload failed for ${key}`);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // 官方推荐的错误处理方法
  private handleTosError(error: any, context: string): void {
    if (error instanceof TosClientError) {
      this.logger.error(`${context} - Client Error:`, error.message);
    } else if (error instanceof TosServerError) {
      this.logger.error(`${context} - Server Error:`, {
        requestId: error.requestId,
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      });
    } else {
      this.logger.error(`${context} - Unexpected Error:`, error.message);
    }
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      const response = await this.tosClient.getObject({
        bucket: this.config.bucket,
        key: key,
      });

      // TOS SDK返回的是Buffer
      if (Buffer.isBuffer(response.data)) {
        return response.data;
      }

      // 如果是其他类型，尝试转换
      if (typeof response.data === 'string') {
        return Buffer.from(response.data);
      }

      throw new Error('Unsupported response data type');
    } catch (error) {
      this.logger.error(`Failed to get file ${key}:`, error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async getFileInfo(key: string): Promise<FileInfo> {
    try {
      const response = await this.tosClient.headObject({
        bucket: this.config.bucket,
        key: key,
      });

      const headers = response.headers || {};

      return {
        key,
        size: parseInt(headers['content-length'] || '0', 10),
        lastModified: new Date(headers['last-modified'] || Date.now()),
        contentType: headers['content-type'] || 'application/octet-stream',
        etag: headers['etag'] || '',
      };
    } catch (error) {
      this.logger.error(`Failed to get file info ${key}:`, error);
      throw new Error(`Get file info failed: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.tosClient.deleteObject({
        bucket: this.config.bucket,
        key: key,
      });
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileInfo(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  getFileUrl(key: string): string {
    if (this.config.cdnDomain) {
      return `${this.config.cdnDomain}/${key}`;
    }

    // 构建标准的TOS访问URL: https://{bucket}.{endpoint}/{key}
    return `https://${this.config.bucket}.${this.config.endpoint}/${key}`;
  }

  generateFileName(originalName: string, userId: number, type: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const ext = originalName.split('.').pop() || '';

    return `${type}/${userId}/${timestamp}-${random}.${ext}`;
  }

  generateSignedUrl(key: string, expiresIn: number = 3600): string {
    try {
      // 使用TOS SDK的预签名URL功能
      const url = this.tosClient.getPreSignedUrl({
        bucket: this.config.bucket,
        key: key,
        expires: expiresIn,
      });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      // 降级到普通URL
      return this.getFileUrl(key);
    }
  }
}
