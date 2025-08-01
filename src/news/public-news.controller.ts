import {
  Controller,
  Get,
  Param,
  Query,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

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
    const result = await this.newsService.findPublishedNews(query);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取新闻详情' })
  @ApiParam({ name: 'id', description: '新闻ID' })
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findOne(+id);
    
    // 只返回已发布的新闻
    if (!news.isPublished) {
      throw new Error('新闻资讯不存在或尚未发布');
    }
    
    return ResponseWrapperUtil.success(news, '查询成功');
  }

  @Post(':id/view')
  @ApiOperation({ summary: '增加新闻浏览次数' })
  @ApiParam({ name: 'id', description: '新闻ID' })
  async incrementViewCount(@Param('id') id: string) {
    await this.newsService.incrementViewCount(+id);
    return ResponseWrapperUtil.successNoData('浏览次数已更新');
  }
}