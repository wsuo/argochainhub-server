import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TosClient, DataTransferType } from '@volcengine/tos-sdk';
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

    this.tosClient = new TosClient({
      region: this.config.region,
      endpoint: this.config.endpoint,
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
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

      const response = await this.tosClient.putObjectFromFile({
        bucket: this.config.bucket,
        key: key,
        filePath: filePath,
        contentType: contentType,
        meta: metadata,
        // 配置上传进度回调
        dataTransferStatusChange: (event) => {
          if (onProgress) {
            let progressType: UploadProgress['type'];
            switch (event.type) {
              case DataTransferType.Started:
                progressType = 'started';
                break;
              case DataTransferType.Rw:
                progressType = 'progress';
                break;
              case DataTransferType.Succeed:
                progressType = 'completed';
                break;
              case DataTransferType.Failed:
                progressType = 'failed';
                break;
              default:
                progressType = 'progress';
            }

            const percentage = event.totalBytes > 0 
              ? Math.round((event.consumedBytes / event.totalBytes) * 100)
              : 0;

            onProgress({
              type: progressType,
              totalBytes: event.totalBytes || fileSize,
              consumedBytes: event.consumedBytes || 0,
              percentage,
            });

            // 记录进度日志
            if (progressType === 'progress' && percentage % 10 === 0) {
              this.logger.log(`Upload progress for ${key}: ${percentage}%`);
            }
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
      this.logger.error(`Failed to upload file from path ${filePath}:`, error);
      throw new Error(`Upload failed: ${error.message}`);
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

    // 构建标准的TOS访问URL
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
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
