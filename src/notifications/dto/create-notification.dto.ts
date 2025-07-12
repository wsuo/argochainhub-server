import { IsEnum, IsNumber, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: '接收用户ID',
    example: 1,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '通知类型',
    enum: NotificationType,
    example: NotificationType.INQUIRY_NEW,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '通知标题',
    example: '新的询价单',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '通知内容',
    example: '您收到了一条新的询价单',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '附加数据',
    example: { relatedId: 1, actionUrl: '/inquiries/1' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: any;
}