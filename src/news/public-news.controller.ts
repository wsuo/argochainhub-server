import {
  Controller,
  Get,
  Param,
  Query,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('新闻资讯（用户端）')
@Controller('news')
export class PublicNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: '获取已发布的新闻列表' })
  async findPublishedNews(@Query() query: {
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    try {
      const result = await this.newsService.findPublishedNews(query);
      return {
        success: true,
        data: result,
        message: '查询成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `查询新闻失败: ${error.message}`,
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取新闻详情' })
  @ApiParam({ name: 'id', description: '新闻ID' })
  async findOne(@Param('id') id: string) {
    try {
      const news = await this.newsService.findOne(+id);
      
      // 只返回已发布的新闻
      if (!news.isPublished) {
        return {
          success: false,
          message: '新闻资讯不存在或尚未发布',
        };
      }
      
      return {
        success: true,
        data: news,
        message: '查询成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `获取新闻失败: ${error.message}`,
      };
    }
  }

  @Post(':id/view')
  @ApiOperation({ summary: '增加新闻浏览次数' })
  @ApiParam({ name: 'id', description: '新闻ID' })
  async incrementViewCount(@Param('id') id: string) {
    try {
      await this.newsService.incrementViewCount(+id);
      return {
        success: true,
        message: '浏览次数已更新',
      };
    } catch (error) {
      return {
        success: false,
        message: `更新浏览次数失败: ${error.message}`,
      };
    }
  }
}