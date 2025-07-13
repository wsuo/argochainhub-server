import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DictionaryService } from './services/dictionary.service';
import { CountryDictionaryService } from './services/country-dictionary.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  CreateDictionaryCategoryDto,
  UpdateDictionaryCategoryDto,
  CreateDictionaryItemDto,
  UpdateDictionaryItemDto,
  BatchImportDictionaryItemDto,
  DictionaryCategoryQueryDto,
  DictionaryItemQueryDto,
} from './dto/dictionary-management.dto';

@ApiTags('字典管理')
@Controller('admin/dictionaries')
@ApiBearerAuth()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  // 字典分类管理
  @Get('categories')
  @ApiOperation({ summary: '获取字典分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategories(
    @Query() queryDto: DictionaryCategoryQueryDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.dictionaryService.getCategories({
      ...queryDto,
      ...paginationDto,
    });
  }

  @Get('categories/:code')
  @ApiOperation({ summary: '根据代码获取字典分类详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'code', description: '分类代码' })
  async getCategoryByCode(@Param('code') code: string) {
    return this.dictionaryService.getCategoryByCode(code);
  }

  @Post('categories')
  @ApiOperation({ summary: '创建字典分类' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createCategory(@Body() createDto: CreateDictionaryCategoryDto) {
    return this.dictionaryService.createCategory(createDto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新字典分类' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDictionaryCategoryDto,
  ) {
    return this.dictionaryService.updateCategory(id, updateDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除字典分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.dictionaryService.deleteCategory(id);
    return { message: 'Dictionary category deleted successfully' };
  }

  // 字典项管理
  @Get(':categoryCode/items')
  @ApiOperation({ summary: '获取指定分类的字典项列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async getItems(
    @Param('categoryCode') categoryCode: string,
    @Query() queryDto: DictionaryItemQueryDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.dictionaryService.getItems(categoryCode, {
      ...queryDto,
      ...paginationDto,
    });
  }

  @Post(':categoryCode/items')
  @ApiOperation({ summary: '在指定分类下创建字典项' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async createItem(
    @Param('categoryCode') categoryCode: string,
    @Body() createDto: CreateDictionaryItemDto,
  ) {
    return this.dictionaryService.createItem(categoryCode, createDto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: '更新字典项' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDictionaryItemDto,
  ) {
    return this.dictionaryService.updateItem(id, updateDto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除字典项' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    await this.dictionaryService.deleteItem(id);
    return { message: 'Dictionary item deleted successfully' };
  }

  @Post(':categoryCode/batch')
  @ApiOperation({ summary: '批量导入字典项' })
  @ApiResponse({ status: 201, description: '导入成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async batchImportItems(
    @Param('categoryCode') categoryCode: string,
    @Body() batchDto: BatchImportDictionaryItemDto,
  ) {
    return this.dictionaryService.batchImportItems(categoryCode, batchDto);
  }
}

// 前端查询控制器（不需要认证）
@ApiTags('字典查询')
@Controller('dictionaries')
export class PublicDictionaryController {
  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly countryDictionaryService: CountryDictionaryService,
  ) {}

  @Get(':categoryCode')
  @ApiOperation({ summary: '获取指定分类的字典项（前端用）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async getDictionaryByCode(@Param('categoryCode') categoryCode: string) {
    return this.dictionaryService.getDictionaryByCode(categoryCode);
  }

  @Get('countries/with-flags')
  @ApiOperation({ summary: '获取包含国旗的国家列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCountriesWithFlags() {
    return this.countryDictionaryService.getCountriesWithFlags();
  }
}