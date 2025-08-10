import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SamplesService } from './samples.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';
import { SampleRequestStatus } from '../entities/sample-request.entity';
import {
  CreateSampleRequestDto,
  GetSampleRequestsDto,
  CancelSampleRequestDto,
  ConfirmDeliveryDto,
  EvaluateSampleDto,
  ApproveSampleRequestDto,
  RejectSampleRequestDto,
  ShipSampleRequestDto,
} from './dto/sample-request.dto';

@ApiTags('样品管理')
@Controller('samples')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}

  // ==================== 采购商端接口 ====================

  @Post()
  @ApiOperation({ summary: '创建样品申请（采购商）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async createSampleRequest(
    @CurrentUser() user: User,
    @Body() createDto: CreateSampleRequestDto,
  ) {
    const result = await this.samplesService.createSampleRequest(user, createDto);
    return ResponseWrapperUtil.success(result, '样品申请创建成功');
  }

  @Get()
  @ApiOperation({ summary: '获取我的样品申请列表（采购商）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SampleRequestStatus })
  @ApiQuery({ name: 'supplierId', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMySampleRequests(
    @CurrentUser() user: User,
    @Query() queryDto: GetSampleRequestsDto,
  ) {
    const result = await this.samplesService.getMySampleRequests(user, queryDto);
    return ResponseWrapperUtil.successWithPagination(
      result,
      '获取样品申请列表成功',
    );
  }

  @Get('stats')
  @ApiOperation({ summary: '获取样品申请统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSampleRequestStats(@CurrentUser() user: User) {
    const result = await this.samplesService.getSampleRequestStats(user);
    return ResponseWrapperUtil.success(result, '获取统计数据成功');
  }

  @Get('filters')
  @ApiOperation({ summary: '获取筛选选项' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFilters() {
    // 返回状态选项和其他筛选数据
    const filters = {
      statuses: Object.values(SampleRequestStatus).map(status => ({
        value: status,
        label: status,
      })),
      shippingMethods: [
        { value: 'express_delivery', label: '快递配送' },
        { value: 'logistics_delivery', label: '物流配送' },
        { value: 'self_pickup', label: '自提' },
      ],
    };
    return ResponseWrapperUtil.success(filters, '获取筛选选项成功');
  }

  // ==================== 供应商端接口 ====================
  // 注意：这个路由必须在 @Get(':id') 之前定义，否则会被误匹配

  @Get('supplier')
  @ApiOperation({ summary: '获取收到的样品申请（供应商）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SampleRequestStatus })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async getSupplierSampleRequests(
    @CurrentUser() user: User,
    @Query() queryDto: GetSampleRequestsDto,
  ) {
    const result = await this.samplesService.getSupplierSampleRequests(user, queryDto);
    return ResponseWrapperUtil.successWithPagination(
      result,
      '获取样品申请列表成功',
    );
  }

  // ==================== 带参数的路由（必须放在静态路由之后）====================

  @Get(':id')
  @ApiOperation({ summary: '获取样品申请详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '样品申请不存在' })
  @ApiResponse({ status: 403, description: '无权查看' })
  async getSampleRequestDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    const result = await this.samplesService.getSampleRequestDetail(id, user);
    return ResponseWrapperUtil.success(result, '获取样品申请详情成功');
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: '取消样品申请（采购商）' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 400, description: '当前状态不允许取消' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async cancelSampleRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() cancelDto: CancelSampleRequestDto,
  ) {
    const result = await this.samplesService.cancelSampleRequest(id, user, cancelDto);
    return ResponseWrapperUtil.success(result, '样品申请已取消');
  }

  @Put(':id/confirm-delivery')
  @ApiOperation({ summary: '确认收货（采购商）' })
  @ApiResponse({ status: 200, description: '确认成功' })
  @ApiResponse({ status: 400, description: '当前状态不允许确认收货' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async confirmDelivery(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() confirmDto: ConfirmDeliveryDto,
  ) {
    const result = await this.samplesService.confirmDelivery(id, user, confirmDto);
    return ResponseWrapperUtil.success(result, '确认收货成功');
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: '评价样品（采购商）' })
  @ApiResponse({ status: 200, description: '评价成功' })
  @ApiResponse({ status: 400, description: '当前状态不允许评价' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async evaluateSample(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() evaluateDto: EvaluateSampleDto,
  ) {
    // 评价功能可以作为扩展功能，暂时返回成功
    return ResponseWrapperUtil.success(
      { id, evaluation: evaluateDto },
      '评价提交成功',
    );
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '批准样品申请（供应商）' })
  @ApiResponse({ status: 200, description: '批准成功' })
  @ApiResponse({ status: 400, description: '当前状态不允许批准' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async approveSampleRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() approveDto: ApproveSampleRequestDto,
  ) {
    const result = await this.samplesService.approveSampleRequest(id, user, approveDto);
    return ResponseWrapperUtil.success(result, '样品申请已批准');
  }

  @Put(':id/reject')
  @ApiOperation({ summary: '拒绝样品申请（供应商）' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @ApiResponse({ status: 400, description: '当前状态不允许拒绝' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async rejectSampleRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() rejectDto: RejectSampleRequestDto,
  ) {
    const result = await this.samplesService.rejectSampleRequest(id, user, rejectDto);
    return ResponseWrapperUtil.success(result, '样品申请已拒绝');
  }

  @Put(':id/ship')
  @ApiOperation({ summary: '发货（供应商）' })
  @ApiResponse({ status: 200, description: '发货成功' })
  @ApiResponse({ status: 400, description: '当前状态不允许发货' })
  @ApiResponse({ status: 403, description: '无权操作' })
  async shipSampleRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() shipDto: ShipSampleRequestDto,
  ) {
    const result = await this.samplesService.shipSampleRequest(id, user, shipDto);
    return ResponseWrapperUtil.success(result, '样品已发货');
  }
}