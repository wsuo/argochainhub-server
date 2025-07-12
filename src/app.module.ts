import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
