import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TimezoneInterceptor } from './common/interceptors/timezone.interceptor';

// 设置应用程序时区为东八区
process.env.TZ = 'Asia/Shanghai';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 全局时区转换拦截器
  app.useGlobalInterceptors(new TimezoneInterceptor());

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS配置
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development' ? true : ['http://localhost:3020'],
    credentials: true,
  });

  // API前缀
  app.setGlobalPrefix('api/v1');

  // Swagger文档配置
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Argochainhub API')
      .setDescription('智慧农化采购平台API文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('app.port') || 3050;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
