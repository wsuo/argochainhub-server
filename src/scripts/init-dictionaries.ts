import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DictionaryInitService } from '../admin/services/dictionary-init.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🚀 Starting dictionary initialization...');
    
    const dictionaryInitService = app.get(DictionaryInitService);
    await dictionaryInitService.initializeAllDictionaries();
    
    console.log('✅ Dictionary initialization completed successfully!');
  } catch (error) {
    console.error('❌ Dictionary initialization failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();