import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  BadRequestException,
  Param,
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
import { ImageParseService, ParseTask } from './image-parse.service';
import { ParsePriceImagesDto } from './dto/parse-price-images.dto';
import { SaveParsedPriceDataDto } from './dto/save-parsed-price-data.dto';
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
    description: '图片解析任务已创建，正在后台处理',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: '任务ID，用于查询处理进度' },
            totalImages: { type: 'number', description: '待处理的图片数量' },
            estimatedTime: { type: 'string', description: '预计处理时间' }
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

    // 立即返回任务ID，后台异步处理
    const taskId = await this.imageParseService.createParseTask(
      images,
      parsePriceImagesDto.exchangeRate
    );

    const estimatedTime = images.length <= 3 ? '30秒内' : 
                         images.length <= 6 ? '1-2分钟' : '2-3分钟';

    return ResponseWrapperUtil.success({
      taskId,
      totalImages: images.length,
      estimatedTime
    }, '图片解析任务已创建，正在后台处理');
  }

  @Get('task-status/:taskId')
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '查询图片解析任务状态' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '任务状态查询成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['processing', 'completed', 'failed'],
              description: '任务状态: processing(处理中), completed(已完成), failed(失败)'
            },
            totalImages: { type: 'number' },
            processedImages: { type: 'number' },
            totalParsedData: { type: 'number' },
            progress: { type: 'number', description: '进度百分比 (0-100)' },
            imageResults: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  imageIndex: { type: 'number', description: '图片序号（从1开始）' },
                  imageName: { type: 'string', description: '图片文件名' },
                  imageUrl: { type: 'string', description: '图片访问URL' },
                  parseStatus: { type: 'string', enum: ['success', 'failed'], description: '解析状态' },
                  errorMessage: { type: 'string', description: '错误信息（如果解析失败）' },
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
                  }
                }
              }
            },
            globalErrors: { type: 'array', items: { type: 'string' } },
            completedAt: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  async getTaskStatus(@Param('taskId') taskId: string): Promise<{ success: boolean; message: string; data: ParseTask }> {
    const status = await this.imageParseService.getTaskStatus(taskId);
    return ResponseWrapperUtil.success(status, '任务状态查询成功');
  }

  @Post('save-price-data')
  @AdminRoles('super_admin', 'admin')
  @ApiOperation({ summary: '保存用户编辑后的价格数据' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '价格数据保存成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            totalItems: { type: 'number', description: '总数据条数' },
            successfulSaves: { type: 'number', description: '成功保存条数' },
            failedSaves: { type: 'number', description: '保存失败条数' },
            savedData: { 
              type: 'array',
              description: '成功保存的数据',
              items: { type: 'object' }
            },
            errors: { 
              type: 'array',
              description: '错误信息列表',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '请求参数错误' 
  })
  async saveParsedPriceData(@Body() saveDataDto: SaveParsedPriceDataDto) {
    const result = await this.imageParseService.saveParsedPriceData({
      taskId: saveDataDto.taskId,
      exchangeRate: saveDataDto.exchangeRate,
      priceData: saveDataDto.priceData
    });
    
    // 总是返回成功响应，但在数据中标明实际结果
    return ResponseWrapperUtil.success({
      ...result.data,
      operationSuccess: result.success
    }, result.message);
  }
}