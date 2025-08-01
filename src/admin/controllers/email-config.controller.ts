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
import { Repository } from 'typeorm';
import { AdminAuthGuard } from '../../common/guards';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { EmailConfig } from '../../entities/email-config.entity';
import { AdminUser } from '../../entities/admin-user.entity';
import { EmailService } from '../services/email.service';
import {
  CreateEmailConfigDto,
  UpdateEmailConfigDto,
  EmailConfigListDto,
  TestEmailConfigDto,
} from '../dto/email-management.dto';
import { ResponseWrapperUtil } from '../../common/utils/response-wrapper.util';

@ApiTags('admin-email-config')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/email-configs')
export class EmailConfigController {
  constructor(
    @InjectRepository(EmailConfig)
    private emailConfigRepository: Repository<EmailConfig>,
    private emailService: EmailService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取邮件配置列表' })
  @ApiResponse({ status: 200, description: '返回邮件配置列表' })
  async getEmailConfigs(@Query() query: EmailConfigListDto) {
    const { page = 1, limit = 10, isActive, isDefault } = query;

    const queryBuilder = this.emailConfigRepository.createQueryBuilder('config');

    if (isActive !== undefined) {
      queryBuilder.andWhere('config.isActive = :isActive', { isActive });
    }

    if (isDefault !== undefined) {
      queryBuilder.andWhere('config.isDefault = :isDefault', { isDefault });
    }

    queryBuilder
      .orderBy('config.isDefault', 'DESC')
      .addOrderBy('config.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .limit(limit);

    const [configs, total] = await queryBuilder.getManyAndCount();

    // 隐藏密码字段
    const safeConfigs = configs.map(config => ({
      ...config,
      authPass: '******',
    }));

    const result = {
      data: safeConfigs,
      meta: {
        totalItems: total,
        itemCount: safeConfigs.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };

    return ResponseWrapperUtil.successWithPagination(result, '获取邮件配置列表成功');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取邮件配置详情' })
  @ApiResponse({ status: 200, description: '返回邮件配置详情' })
  async getEmailConfig(@Param('id', ParseIntPipe) id: number) {
    const config = await this.emailConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new BadRequestException('邮件配置不存在');
    }

    // 隐藏密码字段
    const safeConfig = {
      ...config,
      authPass: '******',
    };

    return ResponseWrapperUtil.success(safeConfig, '获取邮件配置详情成功');
  }

  @Post()
  @ApiOperation({ summary: '创建邮件配置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createEmailConfig(
    @Body() dto: CreateEmailConfigDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    // 如果设置为默认，先取消其他默认配置
    if (dto.isDefault) {
      await this.emailConfigRepository.update(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const config = this.emailConfigRepository.create({
      ...dto,
      isActive: true,
    });

    const savedConfig = await this.emailConfigRepository.save(config);

    // 返回时隐藏密码
    const safeConfig = {
      ...savedConfig,
      authPass: '******',
    };

    return ResponseWrapperUtil.success(safeConfig, '邮件配置创建成功');
  }

  @Put(':id')
  @ApiOperation({ summary: '更新邮件配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateEmailConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmailConfigDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    const config = await this.emailConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new BadRequestException('邮件配置不存在');
    }

    // 如果设置为默认，先取消其他默认配置
    if (dto.isDefault && !config.isDefault) {
      await this.emailConfigRepository.update(
        { isDefault: true },
        { isDefault: false },
      );
    }

    // 如果密码字段是******，则不更新密码
    const updateData: any = { ...dto };
    if (updateData.authPass === '******') {
      delete updateData.authPass;
    }

    await this.emailConfigRepository.update(id, updateData);

    // 清理传输器缓存
    await this.emailService.clearTransporterCache(id);

    const updatedConfig = await this.emailConfigRepository.findOne({
      where: { id },
    });

    // 返回时隐藏密码
    const safeConfig = {
      ...updatedConfig!,
      authPass: '******',
    };

    return ResponseWrapperUtil.success(safeConfig, '邮件配置更新成功');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除邮件配置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteEmailConfig(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() admin: AdminUser,
  ) {
    const config = await this.emailConfigRepository.findOne({
      where: { id },
    });

    if (!config) {
      throw new BadRequestException('邮件配置不存在');
    }

    if (config.isDefault) {
      throw new BadRequestException('不能删除默认配置');
    }

    await this.emailConfigRepository.softDelete(id);

    // 清理传输器缓存
    await this.emailService.clearTransporterCache(id);

    return ResponseWrapperUtil.successNoData('邮件配置删除成功');
  }

  @Post(':id/test')
  @ApiOperation({ summary: '测试邮件配置' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testEmailConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TestEmailConfigDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    try {
      await this.emailService.testEmailConfig(id, dto.testEmail);
      return ResponseWrapperUtil.success(
        { testResult: '测试成功' },
        '测试邮件发送成功，请检查收件箱'
      );
    } catch (error) {
      return ResponseWrapperUtil.success(
        { testResult: '测试失败', error: error.message },
        '测试邮件发送失败'
      );
    }
  }
}