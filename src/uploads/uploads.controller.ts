import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AttachmentType } from '../entities/attachment.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('文件管理')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '文件上传',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '上传的文件',
        },
        type: {
          type: 'string',
          enum: Object.values(AttachmentType),
          description: '文件类型',
          example: AttachmentType.PRODUCT_IMAGE,
        },
        relatedId: {
          type: 'number',
          description: '关联ID（如产品ID、公司ID等）',
          example: 123,
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '文件格式不支持或文件过大' })
  async uploadFile(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const { type, relatedId } = uploadDto;
    const result = await this.uploadsService.uploadFile(user, file, type, relatedId);
    return ResponseWrapperUtil.success(result, '文件上传成功');
  }

  @Get('my-files')
  @ApiOperation({ summary: '获取我的文件列表' })
  @ApiQuery({ name: 'type', enum: AttachmentType, required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyFiles(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
    @Query('type') type?: AttachmentType,
  ) {
    const result = await this.uploadsService.getMyFiles(user, { ...paginationDto, type });
    return ResponseWrapperUtil.successWithPagination(result, '获取成功');
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: '根据类型获取文件列表' })
  @ApiParam({ name: 'type', enum: AttachmentType })
  @ApiQuery({ name: 'relatedId', required: false, description: '关联ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFilesByType(
    @CurrentUser() user: User,
    @Param('type') type: AttachmentType,
    @Query() paginationDto: PaginationDto,
    @Query('relatedId', ParseIntPipe) relatedId?: number,
  ) {
    const result = await this.uploadsService.getFilesByType(
      user,
      type,
      relatedId,
      paginationDto,
    );
    return ResponseWrapperUtil.successWithPagination(result, '获取成功');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件信息' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '无访问权限' })
  async getFileInfo(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const file = await this.uploadsService.getFileById(user, id);
    return ResponseWrapperUtil.success(file, '获取成功');
  }

  @Get(':id/url')
  @ApiOperation({ summary: '获取文件访问URL' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '无访问权限' })
  async getFileUrl(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const attachment = await this.uploadsService.getFileById(user, id);
    const result = {
      id: attachment.id,
      url: attachment.url,
      filename: attachment.filename,
    };
    return ResponseWrapperUtil.success(result, '获取文件URL成功');
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载文件' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({ status: 200, description: '下载成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '无访问权限' })
  async downloadFile(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, attachment } = await this.uploadsService.getFileStream(
      user,
      id,
    );

    res.set({
      'Content-Type': attachment.mimetype,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
      'Content-Length': attachment.size.toString(),
    });

    res.send(buffer);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: '预览文件(用于图片等)' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({ status: 200, description: '预览成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '无访问权限' })
  async previewFile(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, attachment } = await this.uploadsService.getFileStream(
      user,
      id,
    );

    // 只允许预览图片文件
    if (!attachment.mimetype.startsWith('image/')) {
      throw new BadRequestException('File type not supported for preview');
    }

    res.set({
      'Content-Type': attachment.mimetype,
      'Cache-Control': 'public, max-age=3600',
    });

    res.send(buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  @ApiResponse({ status: 403, description: '无删除权限' })
  async deleteFile(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.uploadsService.deleteFile(user, id);
    return ResponseWrapperUtil.successNoData('文件删除成功');
  }
}
