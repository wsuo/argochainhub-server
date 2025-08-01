import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminPermissionsGuard } from '../../common/guards/admin-permissions.guard';
import { AdminPermissions } from '../../common/decorators/admin-permissions.decorator';
import { AdminPermission } from '../../types/permissions';
import { VipConfigService } from '../services/vip-config.service';
import {
  CreateVipConfigDto,
  UpdateVipConfigDto,
  VipConfigQueryDto,
} from '../dto/vip-config-management.dto';
import { VipConfig } from '../../entities/vip-config.entity';
import { ResponseWrapperUtil } from '../../common/utils/response-wrapper.util';

@ApiTags('Admin - VIP配置管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminPermissionsGuard)
@Controller('admin/vip-configs')
export class VipConfigController {
  constructor(private readonly vipConfigService: VipConfigService) {}

  @Post()
  @AdminPermissions(AdminPermission.VIP_CONFIG_CREATE)
  @ApiOperation({ summary: '创建VIP配置' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'VIP配置创建成功',
    type: VipConfig,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '参数错误或配置已存在',
  })
  async create(@Body() createDto: CreateVipConfigDto) {
    const result = await this.vipConfigService.create(createDto);
    return ResponseWrapperUtil.success(result, 'VIP配置创建成功');
  }

  @Get()
  @AdminPermissions(AdminPermission.VIP_CONFIG_VIEW)
  @ApiOperation({ summary: '查询VIP配置列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取VIP配置列表成功',
  })
  async findAll(
    @Query() query: VipConfigQueryDto
  ) {
    const result = await this.vipConfigService.findAll(query);
    return ResponseWrapperUtil.successWithPagination(result, '获取VIP配置列表成功');
  }

  @Get('statistics')
  @AdminPermissions(AdminPermission.VIP_CONFIG_VIEW)
  @ApiOperation({ summary: '获取VIP配置统计信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取统计信息成功',
  })
  async getStatistics() {
    const result = await this.vipConfigService.getStatistics();
    return ResponseWrapperUtil.success(result, '获取统计信息成功');
  }

  @Get(':id')
  @AdminPermissions(AdminPermission.VIP_CONFIG_VIEW)
  @ApiOperation({ summary: '获取VIP配置详情' })
  @ApiParam({ name: 'id', description: 'VIP配置ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取VIP配置详情成功',
    type: VipConfig,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'VIP配置不存在',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.vipConfigService.findOne(id);
    return ResponseWrapperUtil.success(result, '获取VIP配置详情成功');
  }

  @Patch(':id')
  @AdminPermissions(AdminPermission.VIP_CONFIG_UPDATE)
  @ApiOperation({ summary: '更新VIP配置' })
  @ApiParam({ name: 'id', description: 'VIP配置ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'VIP配置更新成功',
    type: VipConfig,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'VIP配置不存在',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '参数错误或配置重复',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVipConfigDto
  ) {
    const result = await this.vipConfigService.update(id, updateDto);
    return ResponseWrapperUtil.success(result, 'VIP配置更新成功');
  }

  @Delete(':id')
  @AdminPermissions(AdminPermission.VIP_CONFIG_DELETE)
  @ApiOperation({ summary: '删除VIP配置' })
  @ApiParam({ name: 'id', description: 'VIP配置ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'VIP配置删除成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'VIP配置不存在',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vipConfigService.remove(id);
    return ResponseWrapperUtil.successNoData('VIP配置删除成功');
  }

  @Post(':id/toggle-status')
  @AdminPermissions(AdminPermission.VIP_CONFIG_UPDATE)
  @ApiOperation({ summary: '切换VIP配置状态' })
  @ApiParam({ name: 'id', description: 'VIP配置ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '状态切换成功',
    type: VipConfig,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'VIP配置不存在',
  })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number
  ) {
    const result = await this.vipConfigService.toggleStatus(id);
    return ResponseWrapperUtil.success(result, '状态切换成功');
  }

  @Post('batch-toggle-status')
  @AdminPermissions(AdminPermission.VIP_CONFIG_UPDATE)
  @ApiOperation({ summary: '批量切换VIP配置状态' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '批量状态切换成功',
  })
  async batchToggleStatus(
    @Body() body: { ids: number[]; isActive: boolean }
  ) {
    await this.vipConfigService.batchToggleStatus(body.ids, body.isActive);
    return ResponseWrapperUtil.successNoData('批量状态切换成功');
  }

  @Patch(':id/sort-order')
  @AdminPermissions(AdminPermission.VIP_CONFIG_UPDATE)
  @ApiOperation({ summary: '更新VIP配置排序' })
  @ApiParam({ name: 'id', description: 'VIP配置ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '排序更新成功',
    type: VipConfig,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'VIP配置不存在',
  })
  async updateSortOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { sortOrder: number }
  ) {
    const result = await this.vipConfigService.updateSortOrder(id, body.sortOrder);
    return ResponseWrapperUtil.success(result, '排序更新成功');
  }

  @Get('platform/:platform')
  @AdminPermissions(AdminPermission.VIP_CONFIG_VIEW)
  @ApiOperation({ summary: '根据平台获取VIP配置列表' })
  @ApiParam({ name: 'platform', description: '平台类型', enum: ['supplier', 'purchaser'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取平台VIP配置成功',
    type: [VipConfig],
  })
  async findByPlatform(
    @Param('platform') platform: string
  ) {
    const result = await this.vipConfigService.findByPlatform(platform as any);
    return ResponseWrapperUtil.success(result, '获取平台VIP配置成功');
  }
}