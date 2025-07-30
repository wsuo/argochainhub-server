import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AdminAuthGuard } from '../../common/guards';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { EmailTemplate } from '../../entities/email-template.entity';
import { AdminUser } from '../../entities/admin-user.entity';
import { EmailService } from '../services/email.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateListDto,
  PreviewEmailTemplateDto,
} from '../dto/email-management.dto';

@ApiTags('admin-email-template')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/email-templates')
export class EmailTemplateController {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    private emailService: EmailService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取邮件模板列表' })
  @ApiResponse({ status: 200, description: '返回邮件模板列表' })
  async getEmailTemplates(@Query() query: EmailTemplateListDto) {
    const { page = 1, limit = 10, isActive, triggerEvent, code } = query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (triggerEvent) {
      where.triggerEvent = triggerEvent;
    }

    if (code) {
      where.code = Like(`%${code}%`);
    }

    const [templates, total] = await this.emailTemplateRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: templates,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('trigger-events')
  @ApiOperation({ summary: '获取触发事件列表' })
  @ApiResponse({ status: 200, description: '返回触发事件列表' })
  async getTriggerEvents(): Promise<string[]> {
    // 返回系统支持的触发事件
    return [
      'inquiry.created',
      'inquiry.quoted',
      'inquiry.accepted',
      'inquiry.declined',
      'inquiry.expired',
      'sample_request.created',
      'sample_request.approved',
      'sample_request.rejected',
      'sample_request.shipped',
      'sample_request.delivered',
      'registration_request.created',
      'registration_request.processing',
      'registration_request.completed',
      'company.approved',
      'company.rejected',
      'user.welcome',
      'user.password_reset',
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: '获取邮件模板详情' })
  @ApiResponse({ status: 200, description: '返回邮件模板详情' })
  async getEmailTemplate(@Param('id', ParseIntPipe) id: number): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new BadRequestException('邮件模板不存在');
    }

    return template;
  }

  @Post()
  @ApiOperation({ summary: '创建邮件模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createEmailTemplate(
    @Body() dto: CreateEmailTemplateDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<EmailTemplate> {
    // 检查模板代码是否已存在
    const existingTemplate = await this.emailTemplateRepository.findOne({
      where: { code: dto.code },
    });

    if (existingTemplate) {
      throw new BadRequestException('模板代码已存在');
    }

    const template = this.emailTemplateRepository.create({
      ...dto,
      isActive: true,
    });

    return await this.emailTemplateRepository.save(template);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新邮件模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateEmailTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new BadRequestException('邮件模板不存在');
    }

    // 如果修改了模板代码，检查是否与其他模板冲突
    if (dto.code && dto.code !== template.code) {
      const existingTemplate = await this.emailTemplateRepository.findOne({
        where: { code: dto.code },
      });

      if (existingTemplate) {
        throw new BadRequestException('模板代码已被其他模板使用');
      }
    }

    await this.emailTemplateRepository.update(id, dto);

    const updated = await this.emailTemplateRepository.findOne({
      where: { id },
    });

    if (!updated) {
      throw new BadRequestException('更新后的模板未找到');
    }

    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除邮件模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteEmailTemplate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new BadRequestException('邮件模板不存在');
    }

    await this.emailTemplateRepository.softDelete(id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: '预览邮件模板' })
  @ApiResponse({ status: 200, description: '返回预览内容' })
  async previewEmailTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PreviewEmailTemplateDto,
  ): Promise<{ subject: string; body: string }> {
    return await this.emailService.previewTemplate(
      id,
      dto.variables || {},
      dto.language || 'zh-CN',
    );
  }
}