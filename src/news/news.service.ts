import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '../entities/news.entity';
import { CreateNewsDto, UpdateNewsDto, NewsQueryDto } from './dto/news-management.dto';
import { getTextByLanguage } from '../types/multilang';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async create(createNewsDto: CreateNewsDto): Promise<News> {
    const news = this.newsRepository.create({
      ...createNewsDto,
      sortOrder: createNewsDto.sortOrder ?? 0,
      isPublished: createNewsDto.isPublished ?? false,
    });

    // 如果设置为发布状态，设置发布时间
    if (news.isPublished) {
      news.publishedAt = new Date();
    }

    return await this.newsRepository.save(news);
  }

  async findAll(query: NewsQueryDto): Promise<{
    data: News[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { category, isPublished, keyword, page = 1, pageSize = 10 } = query;
    const queryBuilder = this.newsRepository.createQueryBuilder('news');

    // 基础查询，包含软删除过滤
    queryBuilder.where('news.deletedAt IS NULL');

    // 类别过滤
    if (category) {
      queryBuilder.andWhere('news.category = :category', { category });
    }

    // 发布状态过滤
    if (isPublished !== undefined) {
      queryBuilder.andWhere('news.isPublished = :isPublished', { isPublished });
    }

    // 关键词搜索（支持多语言标题搜索）
    if (keyword) {
      queryBuilder.andWhere(
        `(
          JSON_UNQUOTE(JSON_EXTRACT(news.title, '$."zh-CN"')) LIKE :keyword OR
          JSON_UNQUOTE(JSON_EXTRACT(news.title, '$.en')) LIKE :keyword OR
          JSON_UNQUOTE(JSON_EXTRACT(news.title, '$.es')) LIKE :keyword
        )`,
        { keyword: `%${keyword}%` }
      );
    }

    // 排序：先按sortOrder，再按发布时间倒序
    queryBuilder.orderBy('news.sortOrder', 'ASC')
      .addOrderBy('news.publishedAt', 'DESC')
      .addOrderBy('news.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<News> {
    const news = await this.newsRepository.findOne({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException('新闻资讯不存在');
    }

    return news;
  }

  async update(id: number, updateNewsDto: UpdateNewsDto): Promise<News> {
    const news = await this.findOne(id);

    // 处理发布状态变更
    const wasPublished = news.isPublished;
    const willBePublished = updateNewsDto.isPublished ?? news.isPublished;

    // 更新基本信息
    Object.assign(news, updateNewsDto);

    // 处理发布时间
    if (!wasPublished && willBePublished) {
      news.publishedAt = new Date();
    } else if (wasPublished && !willBePublished) {
      news.publishedAt = undefined;
    }

    return await this.newsRepository.save(news);
  }

  async remove(id: number): Promise<void> {
    const news = await this.findOne(id);
    await this.newsRepository.softRemove(news);
  }

  async publish(id: number): Promise<News> {
    const news = await this.findOne(id);
    
    if (news.isPublished) {
      throw new Error('该新闻已经发布');
    }

    news.publish();
    return await this.newsRepository.save(news);
  }

  async unpublish(id: number): Promise<News> {
    const news = await this.findOne(id);
    
    if (!news.isPublished) {
      throw new Error('该新闻尚未发布');
    }

    news.unpublish();
    return await this.newsRepository.save(news);
  }

  async incrementViewCount(id: number): Promise<void> {
    const news = await this.findOne(id);
    news.incrementViewCount();
    await this.newsRepository.save(news);
  }

  // 获取已发布的新闻（用户端使用）
  async findPublishedNews(query: {
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: News[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return this.findAll({
      ...query,
      isPublished: true,
    });
  }
}