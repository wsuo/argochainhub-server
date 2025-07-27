import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreateNewsDto, UpdateNewsDto, NewsQueryDto } from './dto/news-management.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminPermissions } from '../common/decorators/admin-permissions.decorator';
import { AdminPermission } from '../types/permissions';

@ApiTags('新闻资讯管理')
@Controller('admin/news')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiOperation({ summary: '创建新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_CREATE)
  async create(@Body() createNewsDto: CreateNewsDto) {
    try {
      const news = await this.newsService.create(createNewsDto);
      return {
        success: true,
        data: news,
        message: '新闻资讯创建成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `创建新闻资讯失败: ${error.message}`,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: '查询新闻资讯列表' })
  @AdminPermissions(AdminPermission.NEWS_VIEW)
  async findAll(@Query() query: NewsQueryDto) {
    try {
      const result = await this.newsService.findAll(query);
      return {
        success: true,
        data: result,
        message: '查询成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `查询新闻资讯失败: ${error.message}`,
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取新闻资讯详情' })
  @AdminPermissions(AdminPermission.NEWS_VIEW)
  async findOne(@Param('id') id: string) {
    try {
      const news = await this.newsService.findOne(+id);
      return {
        success: true,
        data: news,
        message: '查询成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `获取新闻资讯失败: ${error.message}`,
      };
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_UPDATE)
  async update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
    try {
      const news = await this.newsService.update(+id, updateNewsDto);
      return {
        success: true,
        data: news,
        message: '新闻资讯更新成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `更新新闻资讯失败: ${error.message}`,
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_DELETE)
  async remove(@Param('id') id: string) {
    try {
      await this.newsService.remove(+id);
      return {
        success: true,
        message: '新闻资讯删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `删除新闻资讯失败: ${error.message}`,
      };
    }
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_UPDATE)
  async publish(@Param('id') id: string) {
    try {
      const news = await this.newsService.publish(+id);
      return {
        success: true,
        data: news,
        message: '新闻资讯发布成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `发布新闻资讯失败: ${error.message}`,
      };
    }
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: '取消发布新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_UPDATE)
  async unpublish(@Param('id') id: string) {
    try {
      const news = await this.newsService.unpublish(+id);
      return {
        success: true,
        data: news,
        message: '新闻资讯已取消发布',
      };
    } catch (error) {
      return {
        success: false,
        message: `取消发布失败: ${error.message}`,
      };
    }
  }
}