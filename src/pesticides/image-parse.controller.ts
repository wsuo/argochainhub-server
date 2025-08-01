import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ImageParseService } from './image-parse.service';
import { ParsePriceImagesDto } from './dto/parse-price-images.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('图片价格解析')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('image-parse')
export class ImageParseController {
  constructor(private readonly imageParseService: ImageParseService) {}

  @Post('price-data')
  @AdminRoles('super_admin', 'admin')
  @UseInterceptors(FilesInterceptor('images', 10, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('只支持图片文件格式'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({ summary: '上传图片并解析价格数据' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '价格数据图片文件（最多10张）'
        },
        exchangeRate: {
          type: 'number',
          description: '当前汇率（1美元=X人民币）',
          example: 7.2095
        }
      },
      required: ['images', 'exchangeRate']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '图片解析完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            totalImages: { type: 'number', description: '处理的图片数量' },
            totalParsedData: { type: 'number', description: '解析出的数据条数' },
            successfulSaves: { type: 'number', description: '成功保存的记录数' },
            failedSaves: { type: 'number', description: '保存失败的记录数' },
            parsedData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productName: { type: 'string' },
                  weekEndDate: { type: 'string' },
                  unitPrice: { type: 'number' }
                }
              }
            },
            errors: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数错误或文件格式不支持' 
  })
  async parsePriceImages(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() parsePriceImagesDto: ParsePriceImagesDto,
  ) {
    if (!images || images.length === 0) {
      throw new BadRequestException('请至少上传一张图片');
    }

    const result = await this.imageParseService.parseImagesForPriceData(
      images,
      parsePriceImagesDto.exchangeRate
    );

    const responseData = {
      totalImages: images.length,
      totalParsedData: result.data.length,
      successfulSaves: result.success ? result.data.filter(d => d).length : 0,
      failedSaves: result.errors.length,
      parsedData: result.data,
      errors: result.errors
    };

    const message = result.success 
      ? `图片解析完成，成功处理 ${responseData.successfulSaves} 条价格数据`
      : '图片解析过程中出现错误，请查看详细信息';
      
    return ResponseWrapperUtil.success(responseData, message);
  }
}