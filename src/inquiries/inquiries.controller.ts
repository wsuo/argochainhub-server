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
} from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyTypeGuard } from '../common/guards/company-type.guard';
import { QuotaGuard } from '../common/guards/quota.guard';
import { CompanyTypes } from '../common/decorators/company-types.decorator';
import { QuotaType } from '../common/decorators/quota-type.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyType } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QuoteInquiryDto } from './dto/quote-inquiry.dto';
import { SearchInquiriesDto } from './dto/search-inquiries.dto';
import { DeclineInquiryDto } from './dto/decline-inquiry.dto';

@ApiTags('询价管理')
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @UseGuards(CompanyTypeGuard, QuotaGuard)
  @CompanyTypes(CompanyType.BUYER)
  @QuotaType('inquiry')
  @ApiOperation({ summary: '创建询价单' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '权限不足或配额不足' })
  async createInquiry(
    @CurrentUser() user: User,
    @Body() createInquiryDto: CreateInquiryDto,
  ) {
    const inquiry = await this.inquiriesService.createInquiry(user, createInquiryDto);
    return {
      success: true,
      message: '询价单创建成功',
      data: inquiry
    };
  }

  @Get()
  @ApiOperation({ summary: '获取我的询价单列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyInquiries(
    @CurrentUser() user: User,
    @Query() searchDto: SearchInquiriesDto,
  ) {
    const result = await this.inquiriesService.getMyInquiries(user, searchDto);
    return {
      success: true,
      message: '获取成功',
      ...result
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取询价单详情' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  @ApiResponse({ status: 403, description: '无访问权限' })
  async getInquiryDetail(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inquiriesService.getInquiryDetail(user, id);
  }

  @Patch(':id/quote')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.SUPPLIER)
  @ApiOperation({ summary: '对询价单进行报价' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '报价成功' })
  @ApiResponse({ status: 403, description: '无权限或状态不允许' })
  async quoteInquiry(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() quoteDto: QuoteInquiryDto,
  ) {
    return this.inquiriesService.quoteInquiry(user, id, quoteDto);
  }

  @Patch(':id/confirm')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.BUYER)
  @ApiOperation({ summary: '确认供应商报价' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '确认成功' })
  @ApiResponse({ status: 403, description: '无权限或状态不允许' })
  async confirmInquiry(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inquiriesService.confirmInquiry(user, id);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: '拒绝询价或报价' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @ApiResponse({ status: 403, description: '无权限或状态不允许' })
  async declineInquiry(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() declineDto: DeclineInquiryDto,
  ) {
    return this.inquiriesService.declineInquiry(user, id, declineDto);
  }

  @Patch(':id/cancel')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.BUYER)
  @ApiOperation({ summary: '取消询价单' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 403, description: '无权限或状态不允许' })
  async cancelInquiry(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inquiriesService.cancelInquiry(user, id);
  }
}
