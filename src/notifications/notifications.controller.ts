import {
  Controller,
  Get,
  Post,
  Patch,
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
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationType,
  NotificationStatus,
} from '../entities/notification.entity';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('通知管理')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '获取我的通知列表' })
  @ApiQuery({ name: 'status', enum: NotificationStatus, required: false })
  @ApiQuery({ name: 'type', enum: NotificationType, required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyNotifications(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
  ) {
    const result = await this.notificationsService.getMyNotifications(user, {
      ...paginationDto,
      status,
      type,
    });
    return ResponseWrapperUtil.successWithPagination(result, '获取通知列表成功');
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return ResponseWrapperUtil.success({ count }, '获取未读数量成功');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.notificationsService.markAsRead(user, id);
    return ResponseWrapperUtil.success(result, '标记为已读成功');
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user);
    return ResponseWrapperUtil.successNoData('所有通知已标记为已读');
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新通知状态' })
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async updateNotification(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    const result = await this.notificationsService.updateNotification(user, id, updateDto);
    return ResponseWrapperUtil.success(result, '通知更新成功');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async deleteNotification(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.notificationsService.deleteNotification(user, id);
    return ResponseWrapperUtil.successNoData('通知删除成功');
  }
}
