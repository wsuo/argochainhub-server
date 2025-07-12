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
    return this.companiesService.getCompanyProfile(user);
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
    return this.companiesService.updateCompanyProfile(user, updateDto);
  }

  @Get('profile/subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取会员订阅状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSubscriptionStatus(@CurrentUser() user: User) {
    return this.companiesService.getSubscriptionStatus(user);
  }

  @Get('suppliers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索供应商' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchSuppliers(@Query() searchDto: SearchCompaniesDto) {
    return this.companiesService.searchSuppliers(searchDto);
  }

  @Get('suppliers/top100')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取Top100供应商' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTop100Suppliers() {
    return this.companiesService.getTop100Suppliers();
  }

  @Get('suppliers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取供应商详情' })
  @ApiParam({ name: 'id', description: '供应商ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '供应商不存在' })
  async getSupplierDetail(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getSupplierDetail(id);
  }
}
