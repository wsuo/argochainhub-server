import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from '../entities/notification.entity';
import { AdminNotification } from '../entities/admin-notification.entity';
import { User } from '../entities/user.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { Company } from '../entities/company.entity';
import { Product } from '../entities/product.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { NotificationsController } from './notifications.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { SystemMonitorController } from './system-monitor.controller';
import { NotificationsService } from './notifications.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { SystemMonitorService } from './system-monitor.service';
import { EventsService } from './events.service';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification, 
      AdminNotification, 
      User, 
      AdminUser, 
      Company, 
      Product, 
      Inquiry
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(), // 启用定时任务
  ],
  controllers: [
    NotificationsController, 
    AdminNotificationsController, 
    SystemMonitorController
  ],
  providers: [
    NotificationsService, 
    AdminNotificationsService, 
    SystemMonitorService,
    EventsService, 
    NotificationGateway
  ],
  exports: [
    NotificationsService, 
    AdminNotificationsService, 
    SystemMonitorService,
    EventsService, 
    NotificationGateway
  ],
})
export class NotificationsModule {}
