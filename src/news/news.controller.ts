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
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

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
    const news = await this.newsService.create(createNewsDto);
    return ResponseWrapperUtil.success(news, '新闻资讯创建成功');
  }

  @Get()
  @ApiOperation({ summary: '查询新闻资讯列表' })
  @AdminPermissions(AdminPermission.NEWS_VIEW)
  async findAll(@Query() query: NewsQueryDto) {
    const result = await this.newsService.findAll(query);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取新闻资讯详情' })
  @AdminPermissions(AdminPermission.NEWS_VIEW)
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findOne(+id);
    return ResponseWrapperUtil.success(news, '查询成功');
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_UPDATE)
  async update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
    const news = await this.newsService.update(+id, updateNewsDto);
    return ResponseWrapperUtil.success(news, '新闻资讯更新成功');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_DELETE)
  async remove(@Param('id') id: string) {
    await this.newsService.remove(+id);
    return ResponseWrapperUtil.successNoData('新闻资讯删除成功');
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_UPDATE)
  async publish(@Param('id') id: string) {
    const news = await this.newsService.publish(+id);
    return ResponseWrapperUtil.success(news, '新闻资讯发布成功');
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: '取消发布新闻资讯' })
  @AdminPermissions(AdminPermission.NEWS_UPDATE)
  async unpublish(@Param('id') id: string) {
    const news = await this.newsService.unpublish(+id);
    return ResponseWrapperUtil.success(news, '新闻资讯已取消发布');
  }
}