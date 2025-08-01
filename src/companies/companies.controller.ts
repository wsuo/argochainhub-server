import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { SearchCompaniesDto } from './dto/search-companies.dto';

@ApiTags('企业管理')
@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('profile/company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前企业信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCompanyProfile(@CurrentUser() user: User) {
    const company = await this.companiesService.getCompanyProfile(user);
    return {
      success: true,
      message: '获取成功',
      data: company
    };
  }

  @Put('profile/company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新企业信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateCompanyProfile(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateCompanyProfileDto,
  ) {
    const company = await this.companiesService.updateCompanyProfile(user, updateDto);
    return {
      success: true,
      message: '企业信息更新成功',
      data: company
    };
  }

  @Get('profile/subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取会员订阅状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSubscriptionStatus(@CurrentUser() user: User) {
    const subscription = await this.companiesService.getSubscriptionStatus(user);
    return {
      success: true,
      message: '获取成功',
      data: subscription
    };
  }

  @Get('suppliers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索供应商' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchSuppliers(@Query() searchDto: SearchCompaniesDto) {
    const result = await this.companiesService.searchSuppliers(searchDto);
    return {
      success: true,
      message: '搜索成功',
      ...result
    };
  }

  @Get('suppliers/top100')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取Top100供应商' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTop100Suppliers() {
    const suppliers = await this.companiesService.getTop100Suppliers();
    return {
      success: true,
      message: '获取成功',
      data: suppliers
    };
  }

  @Get('suppliers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取供应商详情' })
  @ApiParam({ name: 'id', description: '供应商ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '供应商不存在' })
  async getSupplierDetail(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.companiesService.getSupplierDetail(id);
    return {
      success: true,
      message: '获取成功',
      data: supplier
    };
  }
}
