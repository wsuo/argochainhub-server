import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ProductsModule } from './products/products.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OrdersModule } from './orders/orders.module';
import { QuotaModule } from './quota/quota.module';
import { CommonModule } from './common/common.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { SeedModule } from './seed/seed.module';
import { NewsModule } from './news/news.module';
import { PesticidesModule } from './pesticides/pesticides.module';
import { AiConversationsModule } from './ai-conversations/ai-conversations.module';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import tosConfig from './config/tos.config';
import openrouterConfig from './config/openrouter.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, tosConfig, openrouterConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
      inject: [ConfigService],
    }),
    AuthModule,
    CompaniesModule,
    ProductsModule,
    PlansModule,
    SubscriptionsModule,
    OrdersModule,
    QuotaModule,
    CommonModule,
    InquiriesModule,
    AdminModule,
    UploadsModule,
    NotificationsModule,
    StorageModule,
    SeedModule,
    NewsModule,
    PesticidesModule,
    AiConversationsModule,
    ShoppingCartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
