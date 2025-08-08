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
// import { QuotaGuard } from '../common/guards/quota.guard';  // 临时注释，开发阶段暂不使用
import { CompanyTypes } from '../common/decorators/company-types.decorator';
// import { QuotaType } from '../common/decorators/quota-type.decorator';  // 临时注释，开发阶段暂不使用
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompanyType } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { QuoteInquiryDto } from './dto/quote-inquiry.dto';
import { SearchInquiriesDto } from './dto/search-inquiries.dto';
import { DeclineInquiryDto } from './dto/decline-inquiry.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SupplierQuoteSearchDto, QuoteStatsDto, BatchUpdateQuoteDto } from './dto/supplier-quote-management.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('询价管理')
@Controller('inquiries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @UseGuards(CompanyTypeGuard)  // 临时移除 QuotaGuard，便于开发调试
  @CompanyTypes(CompanyType.BUYER)
  // @QuotaType('inquiry')  // 临时注释，后续恢复时启用
  @ApiOperation({ summary: '创建询价单' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })  // 临时修改描述
  async createInquiry(
    @CurrentUser() user: User,
    @Body() createInquiryDto: CreateInquiryDto,
  ) {
    const inquiry = await this.inquiriesService.createInquiry(user, createInquiryDto);
    return ResponseWrapperUtil.success(inquiry, '询价单创建成功');
  }

  @Get()
  @ApiOperation({ summary: '获取我的询价单列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyInquiries(
    @CurrentUser() user: User,
    @Query() searchDto: SearchInquiriesDto,
  ) {
    const result = await this.inquiriesService.getMyInquiries(user, searchDto);
    return ResponseWrapperUtil.successWithPagination(result, '获取成功');
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
    const inquiry = await this.inquiriesService.getInquiryDetailWithMessages(user, id);
    return ResponseWrapperUtil.success(inquiry, '获取询价单详情成功');
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
    const result = await this.inquiriesService.quoteInquiry(user, id, quoteDto);
    return ResponseWrapperUtil.success(result, '报价成功');
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
    const result = await this.inquiriesService.confirmInquiry(user, id);
    return ResponseWrapperUtil.success(result, '确认成功');
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
    const result = await this.inquiriesService.declineInquiry(user, id, declineDto);
    return ResponseWrapperUtil.success(result, '拒绝成功');
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
    const result = await this.inquiriesService.cancelInquiry(user, id);
    return ResponseWrapperUtil.success(result, '取消成功');
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '发送询价消息' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 201, description: '消息发送成功' })
  @ApiResponse({ status: 403, description: '无权限访问此询价单' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const result = await this.inquiriesService.sendMessage(user, id, sendMessageDto);
    return ResponseWrapperUtil.success(result, '消息发送成功');
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '获取询价消息历史' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '无权限访问此询价单' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  async getMessages(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query() getMessagesDto: GetMessagesDto,
  ) {
    const result = await this.inquiriesService.getMessages(user, id, getMessagesDto);
    return ResponseWrapperUtil.successWithPagination(result, '获取消息历史成功');
  }

  // 供应端报价管理接口
  @Get('supplier/quotes')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.SUPPLIER)
  @ApiOperation({ summary: '获取供应商的报价列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '仅供应商可访问' })
  async getSupplierQuotes(
    @CurrentUser() user: User,
    @Query() searchDto: SupplierQuoteSearchDto,
  ) {
    const result = await this.inquiriesService.getSupplierQuotes(user, searchDto);
    return ResponseWrapperUtil.successWithPagination(result, '获取报价列表成功');
  }

  @Get('supplier/quotes/stats')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.SUPPLIER)
  @ApiOperation({ summary: '获取供应商报价统计' })
  @ApiResponse({ status: 200, description: '获取成功', type: QuoteStatsDto })
  @ApiResponse({ status: 403, description: '仅供应商可访问' })
  async getSupplierQuoteStats(@CurrentUser() user: User) {
    const stats = await this.inquiriesService.getSupplierQuoteStats(user);
    return ResponseWrapperUtil.success(stats, '获取报价统计成功');
  }

  @Post('supplier/quotes/batch-update')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.SUPPLIER)
  @ApiOperation({ summary: '批量操作报价' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 403, description: '仅供应商可访问' })
  async batchUpdateQuotes(
    @CurrentUser() user: User,
    @Body() batchUpdateDto: BatchUpdateQuoteDto,
  ) {
    const result = await this.inquiriesService.batchUpdateQuotes(user, batchUpdateDto);
    return ResponseWrapperUtil.success(result, '批量操作完成');
  }

  @Get('supplier/quotes/:id/history')
  @UseGuards(CompanyTypeGuard)
  @CompanyTypes(CompanyType.SUPPLIER)
  @ApiOperation({ summary: '获取询价单报价历史' })
  @ApiParam({ name: 'id', description: '询价单ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '仅供应商可访问' })
  @ApiResponse({ status: 404, description: '询价单不存在' })
  async getQuoteHistory(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.inquiriesService.getQuoteHistory(user, id);
    return ResponseWrapperUtil.success(result, '获取报价历史成功');
  }
}
