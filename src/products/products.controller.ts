import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyTypeGuard } from '../common/guards/company-type.guard';
import { QuotaGuard } from '../common/guards/quota.guard';
import { CompanyTypes } from '../common/decorators/company-types.decorator';
import { QuotaType } from '../common/decorators/quota-type.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyType } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { SearchProductsDto } from './dto/search-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { MyProductsDto } from './dto/my-products.dto';

@ApiTags('产品管理')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索产品' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchProducts(@Query() searchDto: SearchProductsDto) {
    return this.productsService.searchProducts(searchDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取产品详情' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  async getProductDetail(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductDetail(id);
  }
}

@ApiTags('我的产品管理')
@Controller('my-company/products')
@UseGuards(JwtAuthGuard, CompanyTypeGuard)
@CompanyTypes(CompanyType.SUPPLIER)
@ApiBearerAuth()
export class MyProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '获取我的产品列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyProducts(
    @CurrentUser() user: User,
    @Query() myProductsDto: MyProductsDto,
  ) {
    return this.productsService.getMyProducts(user, myProductsDto);
  }

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaType('product')
  @ApiOperation({ summary: '创建新产品' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '配额不足或权限不够' })
  async createProduct(
    @CurrentUser() user: User,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.createProduct(user, createProductDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取我的产品详情' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  async getMyProductDetail(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.getMyProductDetail(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新我的产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '产品状态不允许编辑' })
  async updateMyProduct(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateMyProduct(user, id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除我的产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 403, description: '产品状态不允许删除' })
  async deleteMyProduct(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.productsService.deleteMyProduct(user, id);
    return { message: 'Product deleted successfully' };
  }

  @Post(':id/submit-review')
  @ApiOperation({ summary: '提交产品审核' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '提交成功' })
  @ApiResponse({ status: 403, description: '产品状态不允许提交审核' })
  async submitForReview(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.submitForReview(user, id);
  }
}