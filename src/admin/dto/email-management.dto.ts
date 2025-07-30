import {
  IsString,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultiLangTextDto } from './dictionary-management.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EmailStatus } from '../../entities/email-history.entity';
import { SupportedLanguage } from '../../types/multilang';

// 邮件配置相关DTO
export class CreateEmailConfigDto {
  @ApiProperty({ description: '配置名称' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'SMTP服务器地址' })
  @IsString()
  @Length(1, 255)
  host: string;

  @ApiProperty({ description: 'SMTP端口号' })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiPropertyOptional({ description: '是否使用SSL/TLS', default: true })
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiProperty({ description: '认证用户名' })
  @IsString()
  @Length(1, 255)
  authUser: string;

  @ApiProperty({ description: '认证密码' })
  @IsString()
  @Length(1, 500)
  authPass: string;

  @ApiProperty({ description: '发件人邮箱' })
  @IsEmail()
  fromEmail: string;

  @ApiPropertyOptional({ description: '发件人名称' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fromName?: string;

  @ApiPropertyOptional({ description: '是否为默认配置', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '最大重试次数', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetries?: number;

  @ApiPropertyOptional({ description: '重试延迟（秒）', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(3600)
  retryDelay?: number;
}

export class UpdateEmailConfigDto extends CreateEmailConfigDto {
  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EmailConfigListDto extends PaginationDto {
  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '是否为默认配置' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class TestEmailConfigDto {
  @ApiProperty({ description: '测试邮件接收地址' })
  @IsEmail()
  testEmail: string;
}

// 邮件模板相关DTO
export class EmailVariableDto {
  @ApiProperty({ description: '变量名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '变量描述' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: '示例值' })
  @IsOptional()
  @IsString()
  example?: string;
}

export class CreateEmailTemplateDto {
  @ApiProperty({ description: '模板代码' })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({ description: '模板名称（多语言）' })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  name: MultiLangTextDto;

  @ApiPropertyOptional({ description: '模板描述（多语言）' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  description?: MultiLangTextDto;

  @ApiProperty({ description: '邮件主题（多语言）' })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  subject: MultiLangTextDto;

  @ApiProperty({ description: '邮件内容（HTML格式，多语言）' })
  @ValidateNested()
  @Type(() => MultiLangTextDto)
  body: MultiLangTextDto;

  @ApiPropertyOptional({ description: '支持的变量列表' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailVariableDto)
  variables?: EmailVariableDto[];

  @ApiPropertyOptional({ description: '触发事件' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  triggerEvent?: string;
}

export class UpdateEmailTemplateDto extends CreateEmailTemplateDto {
  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EmailTemplateListDto extends PaginationDto {
  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '触发事件' })
  @IsOptional()
  @IsString()
  triggerEvent?: string;

  @ApiPropertyOptional({ description: '模板代码（模糊搜索）' })
  @IsOptional()
  @IsString()
  code?: string;
}

export class PreviewEmailTemplateDto {
  @ApiPropertyOptional({ description: '变量值', default: {} })
  @IsOptional()
  variables?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: '预览语言', 
    default: 'zh-CN',
    enum: ['zh-CN', 'en', 'es']
  })
  @IsOptional()
  @IsEnum(['zh-CN', 'en', 'es'])
  language?: SupportedLanguage;
}

// 邮件历史相关DTO
export class EmailHistoryListDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: '发送状态',
    enum: EmailStatus
  })
  @IsOptional()
  @IsEnum(EmailStatus)
  status?: EmailStatus;

  @ApiPropertyOptional({ description: '收件人邮箱（模糊搜索）' })
  @IsOptional()
  @IsString()
  toEmail?: string;

  @ApiPropertyOptional({ description: '关联类型' })
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiPropertyOptional({ description: '关联ID' })
  @IsOptional()
  @IsNumber()
  relatedId?: number;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ResendEmailDto {
  @ApiPropertyOptional({ description: '使用的邮件配置ID' })
  @IsOptional()
  @IsNumber()
  configId?: number;
}

// 邮件发送相关DTO
export class SendEmailDto {
  @ApiPropertyOptional({ description: '邮件模板ID' })
  @IsOptional()
  @IsNumber()
  templateId?: number;

  @ApiPropertyOptional({ description: '邮件配置ID' })
  @IsOptional()
  @IsNumber()
  configId?: number;

  @ApiProperty({ description: '收件人邮箱' })
  @IsEmail()
  toEmail: string;

  @ApiPropertyOptional({ description: '收件人名称' })
  @IsOptional()
  @IsString()
  toName?: string;

  @ApiPropertyOptional({ description: '抄送邮箱列表' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  ccEmails?: string[];

  @ApiPropertyOptional({ description: '密送邮箱列表' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bccEmails?: string[];

  @ApiPropertyOptional({ description: '邮件主题（不使用模板时必填）' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: '邮件内容（不使用模板时必填）' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: '模板变量值' })
  @IsOptional()
  variables?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: '邮件语言', 
    default: 'zh-CN',
    enum: ['zh-CN', 'en', 'es']
  })
  @IsOptional()
  @IsEnum(['zh-CN', 'en', 'es'])
  language?: SupportedLanguage;

  @ApiPropertyOptional({ description: '关联类型' })
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiPropertyOptional({ description: '关联ID' })
  @IsOptional()
  @IsNumber()
  relatedId?: number;
}