import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus } from '../../entities/notification.entity';

export class UpdateNotificationDto {
  @ApiProperty({
    description: '通知状态',
    enum: NotificationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}