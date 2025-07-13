import { Injectable } from '@nestjs/common';
import { TosService, UploadResult, FileInfo, UploadProgress } from './tos.service';
import * as fs from 'fs';

export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface LocalFile {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class StorageService {
  constructor(private readonly tosService: TosService) {}

  async uploadFile(
    file: StorageFile,
    userId: number,
    type: string,
    customKey?: string,
  ): Promise<UploadResult> {
    const key =
      customKey ||
      this.tosService.generateFileName(file.originalname, userId, type);

    const metadata = {
      'original-name': file.originalname,
      'upload-user': userId.toString(),
      'file-type': type,
      'upload-time': new Date().toISOString(),
    };

    return this.tosService.uploadFile(
      key,
      file.buffer,
      file.mimetype,
      metadata,
    );
  }

  async uploadFileFromPath(
    file: LocalFile,
    userId: number,
    type: string,
    customKey?: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    const key =
      customKey ||
      this.tosService.generateFileName(file.originalname, userId, type);

    const metadata = {
      'original-name': file.originalname,
      'upload-user': userId.toString(),
      'file-type': type,
      'upload-time': new Date().toISOString(),
    };

    try {
      return await this.tosService.uploadFileFromPath(
        key,
        file.path,
        file.mimetype,
        metadata,
        onProgress,
      );
    } finally {
      // 上传完成后删除临时文件
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.warn(`Failed to delete temporary file ${file.path}:`, error);
        }
      }
    }
  }

  async getFile(key: string): Promise<{
    buffer: Buffer;
    info: FileInfo;
  }> {
    const [buffer, info] = await Promise.all([
      this.tosService.getFile(key),
      this.tosService.getFileInfo(key),
    ]);

    return { buffer, info };
  }

  async getFileInfo(key: string): Promise<FileInfo> {
    return this.tosService.getFileInfo(key);
  }

  async deleteFile(key: string): Promise<void> {
    return this.tosService.deleteFile(key);
  }

  async fileExists(key: string): Promise<boolean> {
    return this.tosService.fileExists(key);
  }

  getFileUrl(key: string): string {
    return this.tosService.getFileUrl(key);
  }

  generateSignedUrl(key: string, expiresIn?: number): string {
    return this.tosService.generateSignedUrl(key, expiresIn);
  }
}
