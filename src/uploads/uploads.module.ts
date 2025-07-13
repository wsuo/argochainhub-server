import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Attachment } from '../entities/attachment.entity';
import { StorageModule } from '../storage/storage.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    StorageModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // 确保上传目录存在
        const uploadPath = configService.get<string>('UPLOAD_PATH') || './uploads';
        const tempDir = path.join(uploadPath, 'temp');
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: tempDir,
            filename: (req, file, callback) => {
              // 生成唯一文件名：时间戳-随机数-原文件名
              const timestamp = Date.now();
              const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
              const ext = path.extname(file.originalname);
              const baseName = path.basename(file.originalname, ext);
              callback(null, `${timestamp}-${random}-${baseName}${ext}`);
            },
          }),
          fileFilter: (req, file, callback) => {
            if (
              !file.originalname.match(
                /\.(jpg|jpeg|png|gif|bmp|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i,
              )
            ) {
              return callback(
                new Error('Only image and document files are allowed!'),
                false,
              );
            }
            callback(null, true);
          },
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
