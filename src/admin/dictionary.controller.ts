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
import {
  CreateDictionaryCategoryDto,
  UpdateDictionaryCategoryDto,
  CreateDictionaryItemDto,
  UpdateDictionaryItemDto,
  BatchImportDictionaryItemDto,
  DictionaryCategoryQueryDto,
  DictionaryItemQueryDto,
} from './dto/dictionary-management.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('字典管理')
@Controller('admin/dictionaries')
@ApiBearerAuth()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  // 字典分类管理
  @Get('categories')
  @ApiOperation({ summary: '获取字典分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategories(@Query() queryDto: DictionaryCategoryQueryDto) {
    const result = await this.dictionaryService.getCategories(queryDto);
    return ResponseWrapperUtil.successWithPagination(result, '获取字典分类成功');
  }

  @Get('categories/:code')
  @ApiOperation({ summary: '根据代码获取字典分类详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'code', description: '分类代码' })
  async getCategoryByCode(@Param('code') code: string) {
    const result = await this.dictionaryService.getCategoryByCode(code);
    return ResponseWrapperUtil.success(result, '获取字典分类详情成功');
  }

  @Post('categories')
  @ApiOperation({ summary: '创建字典分类' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createCategory(@Body() createDto: CreateDictionaryCategoryDto) {
    const result = await this.dictionaryService.createCategory(createDto);
    return ResponseWrapperUtil.success(result, '字典分类创建成功');
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新字典分类' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDictionaryCategoryDto,
  ) {
    const result = await this.dictionaryService.updateCategory(id, updateDto);
    return ResponseWrapperUtil.success(result, '字典分类更新成功');
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除字典分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.dictionaryService.deleteCategory(id);
    return ResponseWrapperUtil.successNoData('字典分类删除成功');
  }

  // 字典项管理
  @Get(':categoryCode/items')
  @ApiOperation({ summary: '获取指定分类的字典项列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async getItems(
    @Param('categoryCode') categoryCode: string,
    @Query() queryDto: DictionaryItemQueryDto,
  ) {
    const result = await this.dictionaryService.getItems(categoryCode, queryDto);
    return ResponseWrapperUtil.successWithPagination(result, '获取字典项列表成功');
  }

  @Post(':categoryCode/items')
  @ApiOperation({ summary: '在指定分类下创建字典项' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async createItem(
    @Param('categoryCode') categoryCode: string,
    @Body() createDto: CreateDictionaryItemDto,
  ) {
    const result = await this.dictionaryService.createItem(categoryCode, createDto);
    return ResponseWrapperUtil.success(result, '字典项创建成功');
  }

  @Put('items/:id')
  @ApiOperation({ summary: '更新字典项' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDictionaryItemDto,
  ) {
    const result = await this.dictionaryService.updateItem(id, updateDto);
    return ResponseWrapperUtil.success(result, '字典项更新成功');
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除字典项' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    await this.dictionaryService.deleteItem(id);
    return ResponseWrapperUtil.successNoData('字典项删除成功');
  }

  @Post(':categoryCode/batch')
  @ApiOperation({ summary: '批量导入字典项' })
  @ApiResponse({ status: 201, description: '导入成功' })
  @ApiParam({ name: 'categoryCode', description: '分类代码' })
  async batchImportItems(
    @Param('categoryCode') categoryCode: string,
    @Body() batchDto: BatchImportDictionaryItemDto,
  ) {
    const result = await this.dictionaryService.batchImportItems(categoryCode, batchDto);
    return ResponseWrapperUtil.success(result, '批量导入字典项成功');
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
    const result = await this.dictionaryService.getDictionaryByCode(categoryCode);
    return ResponseWrapperUtil.success(result, '获取字典数据成功');
  }

  @Get('countries/with-flags')
  @ApiOperation({ summary: '获取包含国旗的国家列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCountriesWithFlags() {
    const result = await this.countryDictionaryService.getCountriesWithFlags();
    return ResponseWrapperUtil.success(result, '获取国家列表成功');
  }
}