import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailConfig } from '../../entities/email-config.entity';
import { EmailTemplate } from '../../entities/email-template.entity';
import { EmailHistory, EmailStatus } from '../../entities/email-history.entity';
import { SendEmailDto } from '../dto/email-management.dto';
import { getTextByLanguage, SupportedLanguage } from '../../types/multilang';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporters: Map<number, nodemailer.Transporter> = new Map();

  constructor(
    @InjectRepository(EmailConfig)
    private emailConfigRepository: Repository<EmailConfig>,
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(EmailHistory)
    private emailHistoryRepository: Repository<EmailHistory>,
  ) {}

  /**
   * 发送邮件
   */
  async sendEmail(dto: SendEmailDto, createdBy?: number): Promise<EmailHistory> {
    try {
      // 获取邮件配置
      const config = await this.getEmailConfig(dto.configId);
      if (!config) {
        throw new BadRequestException('未找到可用的邮件配置');
      }

      // 准备邮件内容
      let subject = dto.subject;
      let body = dto.body;
      let templateId = dto.templateId;

      // 如果使用模板
      if (templateId) {
        const template = await this.emailTemplateRepository.findOne({
          where: { id: templateId, isActive: true },
        });

        if (!template) {
          throw new NotFoundException('邮件模板不存在或已禁用');
        }

        // 获取对应语言的内容
        const language = dto.language || 'zh-CN';
        subject = getTextByLanguage(template.subject, language);
        body = getTextByLanguage(template.body, language);

        // 替换变量
        if (dto.variables) {
          subject = this.replaceVariables(subject, dto.variables);
          body = this.replaceVariables(body, dto.variables);
        }
      }

      if (!subject || !body) {
        throw new BadRequestException('邮件主题和内容不能为空');
      }

      // 创建邮件历史记录
      const history = this.emailHistoryRepository.create({
        templateId,
        configId: config.id,
        toEmail: dto.toEmail,
        toName: dto.toName,
        ccEmails: dto.ccEmails,
        bccEmails: dto.bccEmails,
        subject,
        body,
        variables: dto.variables,
        language: dto.language || 'zh-CN',
        status: EmailStatus.PENDING,
        relatedType: dto.relatedType,
        relatedId: dto.relatedId,
        createdBy,
      });

      await this.emailHistoryRepository.save(history);

      // 异步发送邮件
      this.sendEmailAsync(history, config);

      return history;
    } catch (error) {
      this.logger.error('发送邮件失败', error);
      throw error;
    }
  }

  /**
   * 异步发送邮件
   */
  private async sendEmailAsync(history: EmailHistory, config: EmailConfig): Promise<void> {
    try {
      // 更新状态为发送中
      await this.emailHistoryRepository.update(history.id, {
        status: EmailStatus.SENDING,
        attempts: history.attempts + 1,
      });

      // 获取或创建传输器
      const transporter = await this.getTransporter(config);

      // 发送邮件
      const mailOptions: nodemailer.SendMailOptions = {
        from: config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail,
        to: history.toName ? `${history.toName} <${history.toEmail}>` : history.toEmail,
        cc: history.ccEmails,
        bcc: history.bccEmails,
        subject: history.subject,
        html: history.body,
      };

      await transporter.sendMail(mailOptions);

      // 更新为发送成功
      await this.emailHistoryRepository.update(history.id, {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(`邮件发送成功: ${history.toEmail}`);
    } catch (error) {
      this.logger.error(`邮件发送失败: ${history.toEmail}`, error);

      // 判断是否需要重试
      if (history.attempts < config.maxRetries) {
        await this.emailHistoryRepository.update(history.id, {
          status: EmailStatus.RETRY,
          errorMessage: error.message,
        });

        // 延迟重试
        setTimeout(() => {
          this.sendEmailAsync({ ...history, attempts: history.attempts + 1 }, config);
        }, config.retryDelay * 1000);
      } else {
        // 超过重试次数，标记为失败
        await this.emailHistoryRepository.update(history.id, {
          status: EmailStatus.FAILED,
          errorMessage: error.message,
        });
      }
    }
  }

  /**
   * 重新发送邮件
   */
  async resendEmail(historyId: number, configId?: number): Promise<EmailHistory> {
    const history = await this.emailHistoryRepository.findOne({
      where: { id: historyId },
    });

    if (!history) {
      throw new NotFoundException('邮件历史记录不存在');
    }

    // 创建新的发送记录
    const newHistory = new EmailHistory();
    newHistory.templateId = history.templateId;
    newHistory.configId = configId || history.configId;
    newHistory.toEmail = history.toEmail;
    newHistory.toName = history.toName;
    newHistory.ccEmails = history.ccEmails;
    newHistory.bccEmails = history.bccEmails;
    newHistory.subject = history.subject;
    newHistory.body = history.body;
    newHistory.variables = history.variables;
    newHistory.language = history.language;
    newHistory.status = EmailStatus.PENDING;
    newHistory.attempts = 0;
    newHistory.sentAt = undefined;
    newHistory.errorMessage = undefined;
    newHistory.relatedType = history.relatedType;
    newHistory.relatedId = history.relatedId;
    newHistory.createdBy = history.createdBy;

    await this.emailHistoryRepository.save(newHistory);

    // 获取配置并发送
    const config = await this.getEmailConfig(newHistory.configId);
    if (config) {
      this.sendEmailAsync(newHistory, config);
    }

    return newHistory;
  }

  /**
   * 测试邮件配置
   */
  async testEmailConfig(configId: number, testEmail: string): Promise<boolean> {
    try {
      const config = await this.emailConfigRepository.findOne({
        where: { id: configId },
      });

      if (!config) {
        throw new NotFoundException('邮件配置不存在');
      }

      const transporter = await this.createTransporter(config);

      await transporter.sendMail({
        from: config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail,
        to: testEmail,
        subject: '测试邮件 - ArgoChainHub',
        html: `
          <h2>测试邮件</h2>
          <p>这是一封来自 ArgoChainHub 的测试邮件。</p>
          <p>如果您收到此邮件，说明邮件配置正常工作。</p>
          <hr>
          <p>配置名称：${config.name}</p>
          <p>SMTP服务器：${config.host}:${config.port}</p>
          <p>发送时间：${new Date().toLocaleString('zh-CN')}</p>
        `,
      });

      return true;
    } catch (error) {
      this.logger.error('测试邮件发送失败', error);
      throw new BadRequestException(`测试邮件发送失败: ${error.message}`);
    }
  }

  /**
   * 预览邮件模板
   */
  async previewTemplate(
    templateId: number,
    variables: Record<string, any> = {},
    language: SupportedLanguage = 'zh-CN',
  ): Promise<{ subject: string; body: string }> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('邮件模板不存在');
    }

    let subject = getTextByLanguage(template.subject, language);
    let body = getTextByLanguage(template.body, language);

    // 替换变量
    subject = this.replaceVariables(subject, variables);
    body = this.replaceVariables(body, variables);

    return { subject, body };
  }

  /**
   * 获取邮件配置
   */
  private async getEmailConfig(configId?: number): Promise<EmailConfig | null> {
    if (configId) {
      return await this.emailConfigRepository.findOne({
        where: { id: configId, isActive: true },
      });
    }

    // 获取默认配置
    return await this.emailConfigRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
  }

  /**
   * 获取或创建传输器
   */
  private async getTransporter(config: EmailConfig): Promise<nodemailer.Transporter> {
    if (!this.transporters.has(config.id)) {
      const transporter = await this.createTransporter(config);
      this.transporters.set(config.id, transporter);
    }
    return this.transporters.get(config.id)!;
  }

  /**
   * 创建传输器
   */
  private async createTransporter(config: EmailConfig): Promise<nodemailer.Transporter> {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.authUser,
        pass: config.authPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 验证配置
    await transporter.verify();

    return transporter;
  }

  /**
   * 替换变量
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * 清理传输器缓存
   */
  async clearTransporterCache(configId?: number): Promise<void> {
    if (configId) {
      const transporter = this.transporters.get(configId);
      if (transporter) {
        transporter.close();
        this.transporters.delete(configId);
      }
    } else {
      // 清理所有
      this.transporters.forEach((transporter) => {
        transporter.close();
      });
      this.transporters.clear();
    }
  }
}