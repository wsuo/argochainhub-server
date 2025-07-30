import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AdminAuthGuard } from '../../common/guards';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { EmailHistory } from '../../entities/email-history.entity';
import { AdminUser } from '../../entities/admin-user.entity';
import { EmailService } from '../services/email.service';
import {
  EmailHistoryListDto,
  ResendEmailDto,
  SendEmailDto,
} from '../dto/email-management.dto';

@ApiTags('admin-email-history')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/email-histories')
export class EmailHistoryController {
  constructor(
    @InjectRepository(EmailHistory)
    private emailHistoryRepository: Repository<EmailHistory>,
    private emailService: EmailService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取邮件发送历史' })
  @ApiResponse({ status: 200, description: '返回邮件发送历史列表' })
  async getEmailHistories(@Query() query: EmailHistoryListDto) {
    const {
      page = 1,
      limit = 10,
      status,
      toEmail,
      relatedType,
      relatedId,
      startDate,
      endDate,
    } = query;

    const queryBuilder = this.emailHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.template', 'template')
      .leftJoinAndSelect('history.config', 'config');

    if (status) {
      queryBuilder.andWhere('history.status = :status', { status });
    }

    if (toEmail) {
      queryBuilder.andWhere('history.toEmail LIKE :toEmail', {
        toEmail: `%${toEmail}%`,
      });
    }

    if (relatedType) {
      queryBuilder.andWhere('history.relatedType = :relatedType', {
        relatedType,
      });
    }

    if (relatedId) {
      queryBuilder.andWhere('history.relatedId = :relatedId', { relatedId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('history.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    queryBuilder
      .orderBy('history.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .limit(limit);

    const [histories, total] = await queryBuilder.getManyAndCount();

    // 隐藏邮件配置的密码
    const safeHistories = histories.map(history => ({
      ...history,
      config: history.config
        ? { ...history.config, authPass: '******' }
        : null,
    }));

    return {
      items: safeHistories,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取邮件统计信息' })
  @ApiResponse({ status: 200, description: '返回邮件统计信息' })
  async getEmailStatistics(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);

    // 获取各状态的邮件数量
    const statusCounts = await this.emailHistoryRepository
      .createQueryBuilder('history')
      .select('history.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('history.createdAt >= :startDate', { startDate })
      .groupBy('history.status')
      .getRawMany();

    // 获取每日发送量 - 使用原生查询以避免 DATE_FORMAT 问题
    const dailyCountsQuery = `
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM email_histories
      WHERE createdAt >= ? AND deletedAt IS NULL
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    const dailyCounts = await this.emailHistoryRepository.query(dailyCountsQuery, [startDate]);

    // 格式化日期
    const formattedDailyCounts = dailyCounts.map(row => ({
      date: new Date(row.date).toISOString().split('T')[0],
      count: parseInt(row.count),
    }));

    // 获取热门模板
    const templateUsage = await this.emailHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.template', 'template')
      .select('template.id', 'templateId')
      .addSelect('template.code', 'templateCode')
      .addSelect('CAST(template.name AS CHAR)', 'templateName')
      .addSelect('COUNT(history.id)', 'count')
      .where('history.createdAt >= :startDate', { startDate })
      .andWhere('history.templateId IS NOT NULL')
      .groupBy('template.id')
      .addGroupBy('template.code')
      .addGroupBy('template.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // 解析模板名称的 JSON
    const formattedTemplateUsage = templateUsage.map(item => ({
      ...item,
      templateName: item.templateName ? JSON.parse(item.templateName) : null,
      count: parseInt(item.count),
    }));

    return {
      statusCounts: statusCounts.map(item => ({
        ...item,
        count: parseInt(item.count),
      })),
      dailyCounts: formattedDailyCounts,
      templateUsage: formattedTemplateUsage,
      period: {
        startDate,
        endDate: new Date(),
        days: daysNumber,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取邮件详情' })
  @ApiResponse({ status: 200, description: '返回邮件详情' })
  async getEmailHistory(@Param('id', ParseIntPipe) id: number): Promise<EmailHistory> {
    const history = await this.emailHistoryRepository.findOne({
      where: { id },
      relations: ['template', 'config'],
    });

    if (!history) {
      throw new BadRequestException('邮件历史记录不存在');
    }

    // 隐藏密码
    if (history.config) {
      history.config.authPass = '******';
    }

    return history;
  }

  @Post(':id/resend')
  @ApiOperation({ summary: '重新发送邮件' })
  @ApiResponse({ status: 200, description: '重新发送成功' })
  async resendEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResendEmailDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<EmailHistory> {
    return await this.emailService.resendEmail(id, dto.configId);
  }

  @Post('send')
  @ApiOperation({ summary: '发送邮件' })
  @ApiResponse({ status: 200, description: '发送成功' })
  async sendEmail(
    @Body() dto: SendEmailDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<EmailHistory> {
    return await this.emailService.sendEmail(dto, admin.id);
  }
}