import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { ControlMethod } from '../entities/control-method.entity';
import { Inquiry } from '../entities/inquiry.entity';
import { SampleRequest } from '../entities/sample-request.entity';
import { RegistrationRequest } from '../entities/registration-request.entity';
import { AdminUser } from '../entities/admin-user.entity';
import { VipConfig } from '../entities/vip-config.entity';
import { EmailConfig } from '../entities/email-config.entity';
import { EmailTemplate } from '../entities/email-template.entity';
import { EmailHistory } from '../entities/email-history.entity';
import { Subscription } from '../entities/subscription.entity';
import { Order } from '../entities/order.entity';
import { Plan } from '../entities/plan.entity';
import { DictionaryCategory } from '../entities/dictionary-category.entity';
import { DictionaryItem } from '../entities/dictionary-item.entity';
import { AdminNotification } from '../entities/admin-notification.entity';
import { AdminController } from './admin.controller';
import { VipConfigController } from './controllers/vip-config.controller';
import { EmailConfigController } from './controllers/email-config.controller';
import { EmailTemplateController } from './controllers/email-template.controller';
import { EmailHistoryController } from './controllers/email-history.controller';
import { DictionaryController, PublicDictionaryController } from './dictionary.controller';
import { AdminNotificationsController } from '../notifications/admin-notifications.controller';
import { AdminService } from './admin.service';
import { AdminProductsService } from './services/admin-products.service';
import { DictionaryService } from './services/dictionary.service';
import { CountryDictionaryService } from './services/country-dictionary.service';
import { DictionaryInitService } from './services/dictionary-init.service';
import { VolcTranslateService } from './services/volc-translate.service';
import { VipConfigService } from './services/vip-config.service';
import { EmailService } from './services/email.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Product,
      ControlMethod,
      Inquiry,
      SampleRequest,
      RegistrationRequest,
      AdminUser,
      Subscription,
      Order,
      Plan,
      DictionaryCategory,
      DictionaryItem,
      AdminNotification,
      VipConfig,
      EmailConfig,
      EmailTemplate,
      EmailHistory,
    ]),
    NotificationsModule, // 导入通知模块
  ],
  controllers: [
    AdminController, 
    DictionaryController, 
    PublicDictionaryController, 
    VipConfigController,
    EmailConfigController,
    EmailTemplateController,
    EmailHistoryController,
    AdminNotificationsController,
  ],
  providers: [
    AdminService, 
    AdminProductsService,
    DictionaryService,
    CountryDictionaryService,
    DictionaryInitService,
    VolcTranslateService,
    VipConfigService,
    EmailService,
  ],
  exports: [
    AdminService, 
    AdminProductsService,
    DictionaryService,
    CountryDictionaryService,
    DictionaryInitService,
    VolcTranslateService,
    VipConfigService,
    EmailService,
  ],
})
export class AdminModule {}
