import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AdminUser } from '../entities/admin-user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ReviewCompanyDto } from './dto/review-company.dto';
import { ReviewProductDto } from './dto/review-product.dto';
import {
  TranslateRequestDto,
  TranslateResponseDto,
  LanguageDetectionDto,
  LanguageDetectionResponseDto,
} from './dto/translate.dto';
import { DashboardChartsDto } from './dto/dashboard-charts.dto';
import { CreateSubscriptionDto } from './dto/subscription-management.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan-management.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company-management.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product-management.dto';
import { CompanyStatus, CompanyType } from '../entities/company.entity';
import { ProductStatus } from '../entities/product.entity';
import { OrderStatus } from '../entities/order.entity';

@ApiTags('后台管理')
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
@AdminRoles('admin', 'super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/charts')
  @ApiOperation({ summary: '获取仪表盘图表数据' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DashboardChartsDto,
  })
  async getDashboardCharts() {
    return this.adminService.getDashboardCharts();
  }

  @Get('stats')
  @ApiOperation({ summary: '获取管理统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('companies/pending')
  @ApiOperation({ summary: '获取待审核企业列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingCompanies(@Query() paginationDto: PaginationDto) {
    return this.adminService.getPendingCompanies(paginationDto);
  }

  @Post('companies/:id/review')
  @ApiOperation({ summary: '审核企业' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '审核成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  async reviewCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewCompanyDto,
  ) {
    return this.adminService.reviewCompany(id, reviewDto);
  }

  @Get('companies')
  @ApiOperation({ summary: '获取所有企业列表' })
  @ApiQuery({ name: 'status', enum: CompanyStatus, required: false })
  @ApiQuery({ name: 'type', enum: CompanyType, required: false })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllCompanies(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: CompanyStatus,
    @Query('type') type?: CompanyType,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllCompanies({
      ...paginationDto,
      status,
      type,
      search,
    });
  }

  @Get('companies/:id')
  @ApiOperation({ summary: '获取单个企业的详细信息' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  async getCompanyById(@Param('id', ParseIntPipe) companyId: number) {
    return this.adminService.getCompanyById(companyId);
  }

  @Patch('companies/:id/toggle-status')
  @ApiOperation({ summary: '切换企业状态(启用/禁用)' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  async toggleCompanyStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleCompanyStatus(id);
  }

  @Get('products/pending')
  @ApiOperation({ summary: '获取待审核产品列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPendingProducts(@Query() paginationDto: PaginationDto) {
    return this.adminService.getPendingProducts(paginationDto);
  }

  @Post('products/:id/review')
  @ApiOperation({ summary: '审核产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '审核成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  async reviewProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewProductDto,
  ) {
    return this.adminService.reviewProduct(id, reviewDto);
  }

  @Get('products')
  @ApiOperation({ summary: '获取所有产品列表' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @ApiQuery({ name: 'category', required: false, description: '产品分类' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllProducts(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: ProductStatus,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllProducts({
      ...paginationDto,
      status,
      category,
      search,
    });
  }

  @Get('products/:id')
  @ApiOperation({ summary: '获取单个产品的详细信息' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  async getProductById(@Param('id', ParseIntPipe) productId: number) {
    return this.adminService.getProductById(productId);
  }

  @Patch('products/:id/toggle-status')
  @ApiOperation({ summary: '切换产品状态(上线/下线)' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  async toggleProductStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleProductStatus(id);
  }

  @Get('users')
  @ApiOperation({ summary: '获取所有用户列表' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllUsers(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers({
      ...paginationDto,
      search,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: '获取单个用户的详细信息' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserById(@Param('id', ParseIntPipe) userId: number) {
    return this.adminService.getUserById(userId);
  }

  // 翻译服务接口
  @Post('utilities/translate')
  @ApiOperation({ summary: '翻译文本' })
  @ApiResponse({
    status: 200,
    description: '翻译成功',
    type: TranslateResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  @ApiResponse({ status: 500, description: '翻译服务不可用' })
  async translateText(
    @Body() translateDto: TranslateRequestDto,
  ): Promise<TranslateResponseDto> {
    const translatedText = await this.adminService.translateText(translateDto);
    return {
      data: {
        translated_text: translatedText,
      },
    };
  }

  @Post('utilities/detect-language')
  @ApiOperation({ summary: '检测文本语言' })
  @ApiResponse({
    status: 200,
    description: '检测成功',
    type: LanguageDetectionResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '语言检测服务不可用' })
  async detectLanguage(
    @Body() detectionDto: LanguageDetectionDto,
  ): Promise<LanguageDetectionResponseDto> {
    const result = await this.adminService.detectLanguage(detectionDto);
    return {
      data: {
        detected_language: result.language,
        confidence: result.confidence,
      },
    };
  }

  // 订阅管理
  @Get('companies/:id/subscriptions')
  @ApiOperation({ summary: '查看指定企业的订阅历史' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  async getCompanySubscriptions(
    @Param('id', ParseIntPipe) companyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.adminService.getCompanySubscriptions(companyId, paginationDto);
  }

  @Post('companies/:id/subscriptions')
  @ApiOperation({ summary: '手动为企业添加/赠送会员订阅' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 201, description: '添加成功' })
  @ApiResponse({ status: 404, description: '企业或计划不存在' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async createSubscriptionForCompany(
    @Param('id', ParseIntPipe) companyId: number,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.adminService.createSubscriptionForCompany(
      companyId,
      createSubscriptionDto,
    );
  }

  @Delete('subscriptions/:id')
  @ApiOperation({ summary: '取消/终止订阅' })
  @ApiParam({ name: 'id', description: '订阅ID' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 404, description: '订阅不存在' })
  @ApiResponse({ status: 400, description: '订阅已终止' })
  async cancelSubscription(@Param('id', ParseIntPipe) subscriptionId: number) {
    return this.adminService.cancelSubscription(subscriptionId);
  }

  // 订单管理
  @Get('orders')
  @ApiOperation({ summary: '获取所有会员购买订单列表' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '搜索关键词（订单号、企业名称）',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllOrders(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllOrders({
      ...paginationDto,
      status,
      search,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '查看单个订单详情' })
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async getOrderById(@Param('id', ParseIntPipe) orderId: number) {
    return this.adminService.getOrderById(orderId);
  }

  // 会员计划管理
  @Get('plans')
  @ApiOperation({ summary: '获取所有会员计划列表' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: '是否包括未上架的计划',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllPlans(
    @Query() paginationDto: PaginationDto,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.adminService.getAllPlans({
      ...paginationDto,
      includeInactive: includeInactive === true,
    });
  }

  @Post('plans')
  @ApiOperation({ summary: '创建新的会员计划' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.adminService.createPlan(createPlanDto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: '更新会员计划' })
  @ApiParam({ name: 'id', description: '计划ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '计划不存在' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async updatePlan(
    @Param('id', ParseIntPipe) planId: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.adminService.updatePlan(planId, updatePlanDto);
  }

  @Patch('plans/:id/status')
  @ApiOperation({ summary: '上架或下架会员计划' })
  @ApiParam({ name: 'id', description: '计划ID' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '计划不存在' })
  async togglePlanStatus(@Param('id', ParseIntPipe) planId: number) {
    return this.adminService.togglePlanStatus(planId);
  }

  // 企业CRUD管理
  @Post('companies')
  @ApiOperation({ summary: '创建新企业' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.adminService.createCompany(createCompanyDto);
  }

  @Put('companies/:id')
  @ApiOperation({ summary: '更新企业信息' })
  @ApiParam({ name: 'id', description: '企业ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '企业不存在' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async updateCompany(
    @Param('id', ParseIntPipe) companyId: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.adminService.updateCompany(companyId, updateCompanyDto);
  }

  // 产品CRUD管理
  @Post('products')
  @ApiOperation({ summary: '创建新产品' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '供应商企业不存在' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.adminService.createProduct(createProductDto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: '更新产品信息' })
  @ApiParam({ name: 'id', description: '产品ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '产品不存在' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async updateProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(productId, updateProductDto);
  }
}
