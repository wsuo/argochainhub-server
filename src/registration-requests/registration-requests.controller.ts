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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RegistrationRequestsService } from './registration-requests.service';
import {
  CreateRegistrationRequestDto,
  QueryRegistrationRequestDto,
  UpdateRegistrationProgressDto,
  RejectRegistrationRequestDto,
} from './dto/registration-request.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('登记申请管理')
@Controller('registration-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegistrationRequestsController {
  constructor(
    private readonly registrationRequestsService: RegistrationRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建登记申请（采购商）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(
    @Request() req,
    @Body() createDto: CreateRegistrationRequestDto,
  ) {
    const result = await this.registrationRequestsService.createRegistrationRequest(
      req.user,
      createDto,
    );
    return ResponseWrapperUtil.success(result, '登记申请创建成功');
  }

  @Get()
  @ApiOperation({ summary: '查询我的登记申请（采购商）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMyRequests(
    @Request() req,
    @Query() queryDto: QueryRegistrationRequestDto,
  ) {
    const result = await this.registrationRequestsService.getMyRegistrationRequests(
      req.user,
      queryDto,
    );
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get('received')
  @ApiOperation({ summary: '查询收到的登记申请（供应商）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getReceivedRequests(
    @Request() req,
    @Query() queryDto: QueryRegistrationRequestDto,
  ) {
    const result = await this.registrationRequestsService.getReceivedRegistrationRequests(
      req.user,
      queryDto,
    );
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get('stats')
  @ApiOperation({ summary: '获取统计信息（采购商）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMyStats(@Request() req) {
    const result = await this.registrationRequestsService.getStats(
      req.user,
      'buyer',
    );
    return ResponseWrapperUtil.success(result, '查询成功');
  }

  @Get('received/stats')
  @ApiOperation({ summary: '获取统计信息（供应商）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getReceivedStats(@Request() req) {
    const result = await this.registrationRequestsService.getStats(
      req.user,
      'supplier',
    );
    return ResponseWrapperUtil.success(result, '查询成功');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取登记申请详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getById(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.registrationRequestsService.getRegistrationRequestById(
      req.user,
      id,
    );
    return ResponseWrapperUtil.success(result, '查询成功');
  }

  @Get('received/:id')
  @ApiOperation({ summary: '获取收到的登记申请详情（供应商）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getReceivedById(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.registrationRequestsService.getRegistrationRequestById(
      req.user,
      id,
    );
    return ResponseWrapperUtil.success(result, '查询成功');
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消登记申请（采购商）' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancel(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.registrationRequestsService.cancelRegistrationRequest(
      req.user,
      id,
    );
    return ResponseWrapperUtil.success(result, '登记申请已取消');
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: '接受登记申请（供应商）' })
  @ApiResponse({ status: 200, description: '接受成功' })
  async accept(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.registrationRequestsService.acceptRegistrationRequest(
      req.user,
      id,
    );
    return ResponseWrapperUtil.success(result, '登记申请已接受');
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '拒绝登记申请（供应商）' })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  async reject(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDto: RejectRegistrationRequestDto,
  ) {
    const result = await this.registrationRequestsService.rejectRegistrationRequest(
      req.user,
      id,
      rejectDto,
    );
    return ResponseWrapperUtil.success(result, '登记申请已拒绝');
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: '更新进度（供应商）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProgress(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRegistrationProgressDto,
  ) {
    const result = await this.registrationRequestsService.updateProgress(
      req.user,
      id,
      updateDto,
    );
    return ResponseWrapperUtil.success(result, '进度更新成功');
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成登记申请（供应商）' })
  @ApiResponse({ status: 200, description: '完成成功' })
  async complete(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.registrationRequestsService.completeRegistrationRequest(
      req.user,
      id,
    );
    return ResponseWrapperUtil.success(result, '登记申请已完成');
  }
}