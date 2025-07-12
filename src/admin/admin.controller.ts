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
import { CompanyQueryDto } from './dto/company-query.dto';
import { 
  InquiryQueryDto, 
  UpdateInquiryStatusDto 
} from './dto/inquiry-management.dto';
import { 
  SampleRequestQueryDto, 
  UpdateSampleRequestStatusDto 
} from './dto/sample-request-management.dto';
import { 
  RegistrationRequestQueryDto, 
  UpdateRegistrationRequestStatusDto 
} from './dto/registration-request-management.dto';
import { 
  AdminUserQueryDto, 
  CreateAdminUserDto, 
  UpdateAdminUserDto, 
  ChangePasswordDto, 
  ResetPasswordDto 
} from './dto/admin-user-management.dto';
import { CompanyStatus, CompanyType } from '../entities/company.entity';
import { ProductStatus } from '../entities/product.entity';
import { OrderStatus } from '../entities/order.entity';
import { InquiryStatus } from '../entities/inquiry.entity';
import { SampleRequestStatus } from '../entities/sample-request.entity';
import { RegistrationRequestStatus } from '../entities/registration-request.entity';

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
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllCompanies(@Query() queryDto: CompanyQueryDto) {
    return this.adminService.getAllCompanies(queryDto);
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

  // 询价单业务流程管理
  @Get('inquiries')
  @ApiOperation({ summary: '获取询价单列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页条数', example: 20 })
  @ApiQuery({ name: 'inquiryNo', required: false, description: '询价单号' })
  @ApiQuery({ name: 'status', required: false, enum: InquiryStatus, description: '询价单状态' })
  @ApiQuery({ name: 'buyerId', required: false, description: '买方企业ID' })
  @ApiQuery({ name: 'supplierId', required: false, description: '供应商企业ID' })
  @ApiQuery({ name: 'createdStartDate', required: false, description: '创建开始日期 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'createdEndDate', required: false, description: '创建结束日期 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getInquiries(@Query() queryDto: InquiryQueryDto) {
    return this.adminService.getInquiries(queryDto);
  }

  @Get('inquiries/stats')
  @ApiOperation({ summary: '获取询价单统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getInquiryStats() {
    return this.adminService.getInquiryStats();
  }

  @Get('inquiries/:id')
  @ApiOperation({ summary: '获取询价单详情' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  async getInquiryById(@Param('id', ParseIntPipe) inquiryId: number) {
    return this.adminService.getInquiryById(inquiryId);
  }

  @Patch('inquiries/:id/status')
  @ApiOperation({ summary: '更新询价单状态' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '状态转换不合法或参数错误' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  async updateInquiryStatus(
    @Param('id', ParseIntPipe) inquiryId: number,
    @Body() updateDto: UpdateInquiryStatusDto,
  ) {
    return this.adminService.updateInquiryStatus(inquiryId, updateDto);
  }

  @Delete('inquiries/:id')
  @ApiOperation({ summary: '删除询价单' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '询价单状态不允许删除' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  async deleteInquiry(@Param('id', ParseIntPipe) inquiryId: number) {
    await this.adminService.deleteInquiry(inquiryId);
    return { message: '询价单删除成功' };
  }

  // 样品申请业务流程管理
  @Get('sample-requests')
  @ApiOperation({ summary: '获取样品申请列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页条数', example: 20 })
  @ApiQuery({ name: 'sampleReqNo', required: false, description: '样品申请单号' })
  @ApiQuery({ name: 'status', required: false, enum: SampleRequestStatus, description: '样品申请状态' })
  @ApiQuery({ name: 'buyerId', required: false, description: '买方企业ID' })
  @ApiQuery({ name: 'supplierId', required: false, description: '供应商企业ID' })
  @ApiQuery({ name: 'productId', required: false, description: '产品ID' })
  @ApiQuery({ name: 'createdStartDate', required: false, description: '创建开始日期 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'createdEndDate', required: false, description: '创建结束日期 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSampleRequests(@Query() queryDto: SampleRequestQueryDto) {
    return this.adminService.getSampleRequests(queryDto);
  }

  @Get('sample-requests/stats')
  @ApiOperation({ summary: '获取样品申请统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSampleRequestStats() {
    return this.adminService.getSampleRequestStats();
  }

  @Get('sample-requests/:id')
  @ApiOperation({ summary: '获取样品申请详情' })
  @ApiParam({ name: 'id', description: '样品申请ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '样品申请不存在' })
  async getSampleRequestById(@Param('id', ParseIntPipe) sampleRequestId: number) {
    return this.adminService.getSampleRequestById(sampleRequestId);
  }

  @Patch('sample-requests/:id/status')
  @ApiOperation({ summary: '更新样品申请状态' })
  @ApiParam({ name: 'id', description: '样品申请ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '状态转换不合法或参数错误' })
  @ApiResponse({ status: 404, description: '样品申请不存在' })
  async updateSampleRequestStatus(
    @Param('id', ParseIntPipe) sampleRequestId: number,
    @Body() updateDto: UpdateSampleRequestStatusDto,
  ) {
    return this.adminService.updateSampleRequestStatus(sampleRequestId, updateDto);
  }

  @Delete('sample-requests/:id')
  @ApiOperation({ summary: '删除样品申请' })
  @ApiParam({ name: 'id', description: '样品申请ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '样品申请状态不允许删除' })
  @ApiResponse({ status: 404, description: '样品申请不存在' })
  async deleteSampleRequest(@Param('id', ParseIntPipe) sampleRequestId: number) {
    await this.adminService.deleteSampleRequest(sampleRequestId);
    return { message: '样品申请删除成功' };
  }

  // 登记申请业务流程管理
  @Get('registration-requests')
  @ApiOperation({ summary: '获取登记申请列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页条数', example: 20 })
  @ApiQuery({ name: 'regReqNo', required: false, description: '登记申请单号' })
  @ApiQuery({ name: 'status', required: false, enum: RegistrationRequestStatus, description: '登记申请状态' })
  @ApiQuery({ name: 'buyerId', required: false, description: '买方企业ID' })
  @ApiQuery({ name: 'supplierId', required: false, description: '供应商企业ID' })
  @ApiQuery({ name: 'productId', required: false, description: '产品ID' })
  @ApiQuery({ name: 'targetCountry', required: false, description: '目标国家' })
  @ApiQuery({ name: 'createdStartDate', required: false, description: '创建开始日期 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'createdEndDate', required: false, description: '创建结束日期 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRegistrationRequests(@Query() queryDto: RegistrationRequestQueryDto) {
    return this.adminService.getRegistrationRequests(queryDto);
  }

  @Get('registration-requests/stats')
  @ApiOperation({ summary: '获取登记申请统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRegistrationRequestStats() {
    return this.adminService.getRegistrationRequestStats();
  }

  @Get('registration-requests/:id')
  @ApiOperation({ summary: '获取登记申请详情' })
  @ApiParam({ name: 'id', description: '登记申请ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '登记申请不存在' })
  async getRegistrationRequestById(@Param('id', ParseIntPipe) registrationRequestId: number) {
    return this.adminService.getRegistrationRequestById(registrationRequestId);
  }

  @Patch('registration-requests/:id/status')
  @ApiOperation({ summary: '更新登记申请状态' })
  @ApiParam({ name: 'id', description: '登记申请ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '状态转换不合法或参数错误' })
  @ApiResponse({ status: 404, description: '登记申请不存在' })
  async updateRegistrationRequestStatus(
    @Param('id', ParseIntPipe) registrationRequestId: number,
    @Body() updateDto: UpdateRegistrationRequestStatusDto,
  ) {
    return this.adminService.updateRegistrationRequestStatus(registrationRequestId, updateDto);
  }

  @Delete('registration-requests/:id')
  @ApiOperation({ summary: '删除登记申请' })
  @ApiParam({ name: 'id', description: '登记申请ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '登记申请状态不允许删除' })
  @ApiResponse({ status: 404, description: '登记申请不存在' })
  async deleteRegistrationRequest(@Param('id', ParseIntPipe) registrationRequestId: number) {
    await this.adminService.deleteRegistrationRequest(registrationRequestId);
    return { message: '登记申请删除成功' };
  }

  // 管理员账户管理
  @Get('admin-users')
  @ApiOperation({ summary: '获取管理员用户列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页条数', example: 20 })
  @ApiQuery({ name: 'username', required: false, description: '用户名搜索' })
  @ApiQuery({ name: 'role', required: false, description: '角色筛选', enum: ['admin', 'super_admin', 'moderator'] })
  @ApiQuery({ name: 'isActive', required: false, description: '账户状态' })
  @ApiQuery({ name: 'createdStartDate', required: false, description: '创建开始日期 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'createdEndDate', required: false, description: '创建结束日期 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAdminUsers(@Query() queryDto: AdminUserQueryDto) {
    return this.adminService.getAdminUsers(queryDto);
  }

  @Get('admin-users/stats')
  @ApiOperation({ summary: '获取管理员用户统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAdminUserStats() {
    return this.adminService.getAdminUserStats();
  }

  @Get('admin-users/:id')
  @ApiOperation({ summary: '获取管理员用户详情' })
  @ApiParam({ name: 'id', description: '管理员用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '管理员用户不存在' })
  async getAdminUserById(@Param('id', ParseIntPipe) adminUserId: number) {
    return this.adminService.getAdminUserById(adminUserId);
  }

  @Post('admin-users')
  @ApiOperation({ summary: '创建管理员用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  async createAdminUser(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.adminService.createAdminUser(createAdminUserDto);
  }

  @Put('admin-users/:id')
  @ApiOperation({ summary: '更新管理员用户信息' })
  @ApiParam({ name: 'id', description: '管理员用户ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '管理员用户不存在' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  async updateAdminUser(
    @Param('id', ParseIntPipe) adminUserId: number,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateAdminUser(adminUserId, updateAdminUserDto);
  }

  @Patch('admin-users/:id/password')
  @ApiOperation({ summary: '修改管理员用户密码' })
  @ApiParam({ name: 'id', description: '管理员用户ID' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 401, description: '当前密码错误' })
  @ApiResponse({ status: 404, description: '管理员用户不存在' })
  async changePassword(
    @Param('id', ParseIntPipe) adminUserId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.adminService.changePassword(adminUserId, changePasswordDto);
    return { message: '密码修改成功' };
  }

  @Patch('admin-users/:id/reset-password')
  @ApiOperation({ summary: '重置管理员用户密码' })
  @ApiParam({ name: 'id', description: '管理员用户ID' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 404, description: '管理员用户不存在' })
  async resetPassword(
    @Param('id', ParseIntPipe) adminUserId: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.adminService.resetPassword(adminUserId, resetPasswordDto);
    return { message: '密码重置成功' };
  }

  @Patch('admin-users/:id/toggle-status')
  @ApiOperation({ summary: '切换管理员用户状态' })
  @ApiParam({ name: 'id', description: '管理员用户ID' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 404, description: '管理员用户不存在' })
  async toggleAdminUserStatus(@Param('id', ParseIntPipe) adminUserId: number) {
    return this.adminService.toggleAdminUserStatus(adminUserId);
  }

  @Delete('admin-users/:id')
  @ApiOperation({ summary: '删除管理员用户' })
  @ApiParam({ name: 'id', description: '管理员用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '不能删除最后一个超级管理员' })
  @ApiResponse({ status: 404, description: '管理员用户不存在' })
  async deleteAdminUser(@Param('id', ParseIntPipe) adminUserId: number) {
    await this.adminService.deleteAdminUser(adminUserId);
    return { message: '管理员用户删除成功' };
  }
}
