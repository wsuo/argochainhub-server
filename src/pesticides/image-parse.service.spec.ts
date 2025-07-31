import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { ImageParseService } from './image-parse.service';
import { PesticidesService } from './pesticides.service';
import { PriceTrendsService } from './price-trends.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ImageParseService', () => {
  let service: ImageParseService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockPesticidesService: jest.Mocked<PesticidesService>;
  let mockPriceTrendsService: jest.Mocked<PriceTrendsService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'OPENROUTER_API_KEY':
            return 'test-api-key';
          case 'OPENROUTER_API_URL':
            return 'https://openrouter.ai/api/v1/chat/completions';
          case 'OPENROUTER_MODEL':
            return 'openai/gpt-4o';
          default:
            return undefined;
        }
      }),
    } as any;

    mockPesticidesService = {
      findByProductNames: jest.fn(),
    } as any;

    mockPriceTrendsService = {
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageParseService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PesticidesService, useValue: mockPesticidesService },
        { provide: PriceTrendsService, useValue: mockPriceTrendsService },
      ],
    }).compile();

    service = module.get<ImageParseService>(ImageParseService);
  });

  it('应该被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('图片文件验证', () => {
    it('应该拒绝空文件', () => {
      const emptyFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 0,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      expect(() => service['validateImageFile'](emptyFile)).toThrow(BadRequestException);
      expect(() => service['validateImageFile'](emptyFile)).toThrow('图片文件内容为空');
    });

    it('应该拒绝过大的文件', () => {
      const largeFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 11 * 1024 * 1024, // 11MB
        buffer: Buffer.alloc(11 * 1024 * 1024),
      } as Express.Multer.File;

      expect(() => service['validateImageFile'](largeFile)).toThrow(BadRequestException);
      expect(() => service['validateImageFile'](largeFile)).toThrow('图片文件过大');
    });

    it('应该拒绝不支持的文件类型', () => {
      const unsupportedFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('fake pdf content that is longer than 12 bytes'),
      } as Express.Multer.File;

      expect(() => service['validateImageFile'](unsupportedFile)).toThrow(BadRequestException);
      expect(() => service['validateImageFile'](unsupportedFile)).toThrow('不支持的图片格式');
    });

    it('应该接受有效的PNG文件', () => {
      // PNG文件签名: 89 50 4E 47 0D 0A 1A 0A
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const validPngFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.concat([pngSignature, Buffer.alloc(100)]),
      } as Express.Multer.File;

      expect(() => service['validateImageFile'](validPngFile)).not.toThrow();
    });

    it('应该接受有效的JPEG文件', () => {
      // JPEG文件签名: FF D8 FF
      const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
      const validJpegFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.concat([jpegSignature, Buffer.alloc(100)]),
      } as Express.Multer.File;

      expect(() => service['validateImageFile'](validJpegFile)).not.toThrow();
    });
  });

  describe('MIME类型获取', () => {
    it('应该从文件的mimetype获取类型', () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
      } as Express.Multer.File;

      const mimeType = service['getMimeType'](file);
      expect(mimeType).toBe('image/png');
    });

    it('应该从文件扩展名推断类型', () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: undefined,
      } as unknown as Express.Multer.File;

      const mimeType = service['getMimeType'](file);
      expect(mimeType).toBe('image/jpeg');
    });

    it('应该为未知扩展名返回原始mimetype或unknown', () => {
      const file = {
        originalname: 'test.unknown',
        mimetype: undefined,
      } as unknown as Express.Multer.File;

      const mimeType = service['getMimeType'](file);
      expect(mimeType).toBe('unknown/unknown');
    });
  });

  describe('Base64转换', () => {
    it('应该成功转换有效的图片buffer', () => {
      const testBuffer = Buffer.from('test image data');
      const file = {
        originalname: 'test.png',
        buffer: testBuffer,
      } as Express.Multer.File;

      const base64String = service['convertToBase64'](file);
      expect(base64String).toBe(testBuffer.toString('base64'));
      expect(base64String).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('应该拒绝空buffer', () => {
      const file = {
        originalname: 'test.png',
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      expect(() => service['convertToBase64'](file)).toThrow(BadRequestException);
      expect(() => service['convertToBase64'](file)).toThrow('图片文件缓冲区为空');
    });

    it('应该拒绝没有buffer的文件', () => {
      const file = {
        originalname: 'test.png',
        buffer: undefined,
      } as unknown as Express.Multer.File;

      expect(() => service['convertToBase64'](file)).toThrow(BadRequestException);
      expect(() => service['convertToBase64'](file)).toThrow('图片文件缓冲区为空');
    });
  });

  describe('图片解析', () => {
    it('应该拒绝空的图片文件数组', async () => {
      await expect(service.parseImagesForPriceData([], 6.8)).rejects.toThrow(BadRequestException);
      await expect(service.parseImagesForPriceData([], 6.8)).rejects.toThrow('没有提供图片文件');
    });

    it('应该拒绝未定义的图片文件数组', async () => {
      await expect(service.parseImagesForPriceData(undefined as any, 6.8)).rejects.toThrow(BadRequestException);
    });
  });
});