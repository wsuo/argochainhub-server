import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PublicNewsController } from './public-news.controller';
import { News } from '../entities/news.entity';

@Module({
  imports: [TypeOrmModule.forFeature([News])],
  controllers: [NewsController, PublicNewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}