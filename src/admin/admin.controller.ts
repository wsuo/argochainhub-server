import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CompanyStatus, CompanyType } from '../entities/company.entity';
import { ProductStatus } from '../entities/product.entity';

@ApiTags('后台管理')
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@ApiBearerAuth()
@AdminRoles('admin', 'super_admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '获取管理统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats(@CurrentAdmin() admin: AdminUser) {
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
}