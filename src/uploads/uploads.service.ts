import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment, AttachmentType } from '../entities/attachment.entity';
import { User } from '../entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly storageService: StorageService,
  ) {}

  async uploadFile(
    user: User,
    file: Express.Multer.File,
    type: AttachmentType,
    relatedId?: number,
  ): Promise<Attachment> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // 上传到云存储
      const uploadResult = await this.storageService.uploadFile(
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        user.id,
        type,
      );

      // 保存到数据库
      const attachment = this.attachmentRepository.create({
        filename: uploadResult.key.split('/').pop() || file.originalname,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        storageKey: uploadResult.key,
        url: uploadResult.url,
        type,
        relatedId,
        uploadedById: user.id,
      });

      return this.attachmentRepository.save(attachment);
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async getFilesByType(
    user: User,
    type: AttachmentType,
    relatedId?: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Attachment> | Attachment[]> {
    const queryBuilder = this.attachmentRepository
      .createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.uploadedBy', 'uploadedBy')
      .where('attachment.type = :type', { type });

    // 根据文件类型和用户权限过滤
    if (type === AttachmentType.COMPANY_CERTIFICATE) {
      // 企业证书只能查看自己公司的
      queryBuilder.andWhere('uploadedBy.companyId = :companyId', {
        companyId: user.companyId,
      });
    } else if (type === AttachmentType.PRODUCT_IMAGE && relatedId) {
      // 产品图片需要验证产品所有权
      queryBuilder
        .leftJoin('attachment.product', 'product')
        .andWhere('product.supplierId = :companyId', {
          companyId: user.companyId,
        });
    }

    if (relatedId) {
      queryBuilder.andWhere('attachment.relatedId = :relatedId', { relatedId });
    }

    if (paginationDto) {
      const { page = 1, limit = 20 } = paginationDto;
      const [attachments, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('attachment.createdAt', 'DESC')
        .getManyAndCount();

      return {
        data: attachments,
        meta: {
          totalItems: total,
          itemCount: attachments.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      };
    }

    return queryBuilder.orderBy('attachment.createdAt', 'DESC').getMany();
  }

  async getFileById(user: User, id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });

    if (!attachment) {
      throw new NotFoundException('File not found');
    }

    // 检查访问权限
    await this.checkFileAccess(user, attachment);

    return attachment;
  }

  async deleteFile(user: User, id: number): Promise<void> {
    const attachment = await this.getFileById(user, id);

    // 检查删除权限
    if (attachment.uploadedById !== user.id) {
      throw new ForbiddenException('You can only delete your own files');
    }

    try {
      // 从云存储删除文件
      await this.storageService.deleteFile(attachment.storageKey);
    } catch (error) {
      // 文件已经不存在，继续删除数据库记录
      console.warn(`Failed to delete file ${attachment.storageKey}:`, error);
    }

    await this.attachmentRepository.remove(attachment);
  }

  async getFileStream(
    user: User,
    id: number,
  ): Promise<{
    buffer: Buffer;
    attachment: Attachment;
  }> {
    const attachment = await this.getFileById(user, id);

    try {
      const { buffer } = await this.storageService.getFile(
        attachment.storageKey,
      );
      return { buffer, attachment };
    } catch (error) {
      throw new NotFoundException('File not found in storage');
    }
  }

  private async checkFileAccess(
    user: User,
    attachment: Attachment,
  ): Promise<void> {
    switch (attachment.type) {
      case AttachmentType.COMPANY_CERTIFICATE:
        // 企业证书只能访问自己公司的
        if (attachment.uploadedBy.companyId !== user.companyId) {
          throw new ForbiddenException('Access denied to this file');
        }
        break;

      case AttachmentType.PRODUCT_IMAGE:
        // 产品图片需要验证产品所有权或为公开访问
        if (attachment.uploadedBy.companyId !== user.companyId) {
          // 可以考虑允许公开访问产品图片
          // throw new ForbiddenException('Access denied to this file');
        }
        break;

      case AttachmentType.SAMPLE_DOCUMENT:
        // 样品文档需要根据业务逻辑判断
        if (attachment.uploadedBy.companyId !== user.companyId) {
          throw new ForbiddenException('Access denied to this file');
        }
        break;

      default:
        // 其他类型文件需要是文件所有者
        if (attachment.uploadedById !== user.id) {
          throw new ForbiddenException('Access denied to this file');
        }
    }
  }

  async getMyFiles(
    user: User,
    paginationDto: PaginationDto & { type?: AttachmentType },
  ): Promise<PaginatedResult<Attachment>> {
    const { page = 1, limit = 20, type } = paginationDto;

    const queryBuilder = this.attachmentRepository
      .createQueryBuilder('attachment')
      .where('attachment.uploadedById = :userId', { userId: user.id });

    if (type) {
      queryBuilder.andWhere('attachment.type = :type', { type });
    }

    const [attachments, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('attachment.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: attachments,
      meta: {
        totalItems: total,
        itemCount: attachments.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
