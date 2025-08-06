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
  ApiBody,
} from '@nestjs/swagger';
import { AdminNotificationsService, CreateAdminNotificationDto } from './admin-notifications.service';
import { DictionaryService } from '../admin/services/dictionary.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminPermissions } from '../common/decorators/admin-permissions.decorator';
import { AdminPermissionsGuard } from '../common/guards/admin-permissions.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AdminUser } from '../entities/admin-user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  AdminNotificationStatus,
  AdminNotificationPriority,
  AdminNotificationCategory,
  AdminNotificationType,
} from '../entities/admin-notification.entity';
import { AdminPermission } from '../types/permissions';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

import { IsOptional, IsEnum } from 'class-validator';

class AdminNotificationQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AdminNotificationStatus)
  status?: AdminNotificationStatus;

  @IsOptional()
  @IsEnum(AdminNotificationPriority)
  priority?: AdminNotificationPriority;

  @IsOptional()
  @IsEnum(AdminNotificationCategory)
  category?: AdminNotificationCategory;

  @IsOptional()
  @IsEnum(AdminNotificationType)
  type?: AdminNotificationType;
}

class UpdateAdminNotificationDto {
  status?: AdminNotificationStatus;
}

@ApiTags('管理员通知')
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard, AdminPermissionsGuard)
@ApiBearerAuth()
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
    private readonly dictionaryService: DictionaryService,
  ) {}

  @Get('filter-tree')
  @ApiOperation({ summary: '获取通知类型筛选树状结构' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getNotificationFilterTree() {
    const tree = await this.buildNotificationFilterTree();
    return ResponseWrapperUtil.success(tree, '获取筛选树状结构成功');
  }

  @Get()
  @ApiOperation({ summary: '获取我的管理员通知列表' })
  @ApiQuery({ name: 'status', enum: AdminNotificationStatus, required: false })
  @ApiQuery({ name: 'priority', enum: AdminNotificationPriority, required: false })
  @ApiQuery({ name: 'category', enum: AdminNotificationCategory, required: false })
  @ApiQuery({ name: 'type', enum: AdminNotificationType, required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyNotifications(
    @CurrentAdmin() adminUser: AdminUser,
    @Query() queryDto: AdminNotificationQueryDto,
  ) {
    const result = await this.adminNotificationsService.getAdminNotifications(adminUser, queryDto);
    return ResponseWrapperUtil.successWithPagination(result, '获取管理员通知列表成功');
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读管理员通知数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUnreadCount(@CurrentAdmin() adminUser: AdminUser) {
    const count = await this.adminNotificationsService.getUnreadCount(adminUser.id);
    return ResponseWrapperUtil.success({ count }, '获取未读数量成功');
  }

  @Get('unread-count/by-priority')
  @ApiOperation({ summary: '获取按优先级分组的未读通知数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUnreadCountByPriority(@CurrentAdmin() adminUser: AdminUser) {
    const counts = await this.adminNotificationsService.getUnreadCountByPriority(adminUser.id);
    return ResponseWrapperUtil.success(counts, '获取优先级未读数量成功');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记管理员通知为已读' })
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(
    @CurrentAdmin() adminUser: AdminUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.adminNotificationsService.markAsRead(adminUser, id);
    return ResponseWrapperUtil.success(result, '标记为已读成功');
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有管理员通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async markAllAsRead(@CurrentAdmin() adminUser: AdminUser) {
    await this.adminNotificationsService.markAllAsRead(adminUser);
    return ResponseWrapperUtil.success(null, '所有通知已标记为已读');
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: '归档管理员通知' })
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiResponse({ status: 200, description: '归档成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async archiveNotification(
    @CurrentAdmin() adminUser: AdminUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.adminNotificationsService.archiveNotification(adminUser, id);
    return ResponseWrapperUtil.success(result, '通知归档成功');
  }

  @Delete('cleanup-expired')
  @ApiOperation({ summary: '清理过期通知' })
  @AdminPermissions(AdminPermission.SYSTEM_CONFIG)
  @ApiResponse({ status: 200, description: '清理完成' })
  async cleanupExpiredNotifications() {
    const count = await this.adminNotificationsService.cleanupExpiredNotifications();
    return ResponseWrapperUtil.success({ count }, `清理完成，共清理 ${count} 个过期通知`);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除管理员通知' })
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async deleteNotification(
    @CurrentAdmin() adminUser: AdminUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.adminNotificationsService.deleteNotification(adminUser, id);
    return ResponseWrapperUtil.success(null, '通知删除成功');
  }

  // 管理员专用的通知管理接口

  @Post('broadcast')
  @ApiOperation({ summary: '发送广播通知给所有管理员' })
  @AdminPermissions(AdminPermission.ADMIN_MANAGE)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { enum: Object.values(AdminNotificationType) },
        title: { type: 'string' },
        content: { type: 'string' },
        priority: { enum: Object.values(AdminNotificationPriority) },
        category: { enum: Object.values(AdminNotificationCategory) },
        data: { type: 'object' },
      },
      required: ['type', 'title', 'content', 'category'],
    },
  })
  @ApiResponse({ status: 201, description: '广播成功' })
  async broadcastNotification(
    @Body() createDto: {
      type: AdminNotificationType;
      title: string;
      content: string;
      priority?: AdminNotificationPriority;
      category: AdminNotificationCategory;
      data?: any;
    },
  ) {
    const { type, title, content, priority, category, data } = createDto;
    const notifications = await this.adminNotificationsService.createBroadcastNotification(
      type, title, content, priority, category, data
    );
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      `广播通知发送成功，共 ${notifications.length} 个管理员收到通知`
    );
  }

  @Post('by-permission')
  @ApiOperation({ summary: '根据权限发送通知' })
  @AdminPermissions(AdminPermission.ADMIN_MANAGE)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        requiredPermissions: {
          type: 'array',
          items: { enum: Object.values(AdminPermission) },
        },
        type: { enum: Object.values(AdminNotificationType) },
        title: { type: 'string' },
        content: { type: 'string' },
        priority: { enum: Object.values(AdminNotificationPriority) },
        category: { enum: Object.values(AdminNotificationCategory) },
        data: { type: 'object' },
      },
      required: ['requiredPermissions', 'type', 'title', 'content', 'category'],
    },
  })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  async sendNotificationByPermission(
    @Body() createDto: {
      requiredPermissions: AdminPermission[];
      type: AdminNotificationType;
      title: string;
      content: string;
      priority?: AdminNotificationPriority;
      category: AdminNotificationCategory;
      data?: any;
    },
  ) {
    const { requiredPermissions, type, title, content, priority, category, data } = createDto;
    const notifications = await this.adminNotificationsService.createNotificationByPermissions(
      requiredPermissions, type, title, content, priority, category, data
    );
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      `权限通知发送成功，共 ${notifications.length} 个管理员收到通知`
    );
  }

  @Post('smart-distribute')
  @ApiOperation({ summary: '智能分发通知' })
  @AdminPermissions(AdminPermission.ADMIN_MANAGE)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { enum: Object.values(AdminNotificationType) },
        title: { type: 'string' },
        content: { type: 'string' },
        priority: { enum: Object.values(AdminNotificationPriority) },
        category: { enum: Object.values(AdminNotificationCategory) },
        data: { type: 'object' },
        targetAdminId: { type: 'number' },
        targetAdminIds: { type: 'array', items: { type: 'number' } },
        requiredPermissions: { type: 'array', items: { enum: Object.values(AdminPermission) } },
        broadcastToAll: { type: 'boolean' },
      },
      required: ['type', 'title', 'content', 'category'],
    },
  })
  @ApiResponse({ status: 201, description: '通知分发成功' })
  async smartDistributeNotification(@Body() config: CreateAdminNotificationDto) {
    const notifications = await this.adminNotificationsService.createAndDistributeNotification(config);
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      `通知分发成功，共 ${notifications.length} 个管理员收到通知`
    );
  }

  @Post('system-alert')
  @ApiOperation({ summary: '发送系统告警通知' })
  @AdminPermissions(AdminPermission.SYSTEM_CONFIG)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        alertType: { type: 'string' },
        message: { type: 'string' },
        level: { enum: ['warning', 'error', 'critical'] },
      },
      required: ['alertType', 'message'],
    },
  })
  @ApiResponse({ status: 201, description: '系统告警发送成功' })
  async sendSystemAlert(
    @Body() alertDto: {
      alertType: string;
      message: string;
      level?: 'warning' | 'error' | 'critical';
    },
  ) {
    const { alertType, message, level } = alertDto;
    const notifications = await this.adminNotificationsService.notifySystemAlert(alertType, message, level);
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      `系统告警发送成功，共 ${notifications.length} 个管理员收到通知`
    );
  }

  // 业务通知触发接口（供内部调用）

  @Post('trigger/user-registration')
  @ApiOperation({ summary: '触发用户注册审核通知' })
  @AdminPermissions(AdminPermission.USER_VIEW)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        userName: { type: 'string' },
      },
      required: ['userId', 'userName'],
    },
  })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  async triggerUserRegistrationNotification(
    @Body() data: { userId: number; userName: string },
  ) {
    const notifications = await this.adminNotificationsService.notifyUserRegistrationPending(
      data.userId,
      data.userName,
    );
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      '用户注册审核通知发送成功'
    );
  }

  @Post('trigger/company-review')
  @ApiOperation({ summary: '触发企业认证审核通知' })
  @AdminPermissions(AdminPermission.COMPANY_REVIEW)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId: { type: 'number' },
        companyName: { type: 'string' },
      },
      required: ['companyId', 'companyName'],
    },
  })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  async triggerCompanyReviewNotification(
    @Body() data: { companyId: number; companyName: string },
  ) {
    const notifications = await this.adminNotificationsService.notifyCompanyReviewPending(
      data.companyId,
      data.companyName,
    );
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      '企业认证审核通知发送成功'
    );
  }

  @Post('trigger/product-review')
  @ApiOperation({ summary: '触发产品审核通知' })
  @AdminPermissions(AdminPermission.PRODUCT_REVIEW)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number' },
        productName: { type: 'string' },
      },
      required: ['productId', 'productName'],
    },
  })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  async triggerProductReviewNotification(
    @Body() data: { productId: number; productName: string },
  ) {
    const notifications = await this.adminNotificationsService.notifyProductReviewPending(
      data.productId,
      data.productName,
    );
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      '产品审核通知发送成功'
    );
  }

  @Post('trigger/inquiry-created')
  @ApiOperation({ summary: '触发新询价单通知' })
  @AdminPermissions(AdminPermission.INQUIRY_VIEW)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        inquiryId: { type: 'number' },
        buyerName: { type: 'string' },
        productName: { type: 'string' },
      },
      required: ['inquiryId', 'buyerName', 'productName'],
    },
  })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  async triggerInquiryCreatedNotification(
    @Body() data: { inquiryId: number; buyerName: string; productName: string },
  ) {
    const notifications = await this.adminNotificationsService.notifyInquiryCreated(
      data.inquiryId,
      data.buyerName,
      data.productName,
    );
    return ResponseWrapperUtil.success(
      { count: notifications.length },
      '新询价单通知发送成功'
    );
  }

  /**
   * 构建通知类型筛选树状结构
   * 从枚举和字典数据动态构建，不硬编码
   */
  private async buildNotificationFilterTree() {
    // 获取admin_notification_type字典数据
    const notificationTypes = await this.dictionaryService.getDictionaryByCode('admin_notification_type');
    
    // 定义分类与类型的映射关系（基于业务逻辑）
    const categoryTypeMapping: Record<AdminNotificationCategory, {
      label: string;
      value: AdminNotificationCategory;
      children: Array<{ label: string; value: AdminNotificationType }>;
    }> = {
      [AdminNotificationCategory.REVIEW]: {
        label: '审核类',
        value: AdminNotificationCategory.REVIEW,
        children: []
      },
      [AdminNotificationCategory.BUSINESS]: {
        label: '业务类', 
        value: AdminNotificationCategory.BUSINESS,
        children: []
      },
      [AdminNotificationCategory.OPERATION]: {
        label: '运营类',
        value: AdminNotificationCategory.OPERATION,
        children: []
      },
      [AdminNotificationCategory.SYSTEM]: {
        label: '系统类',
        value: AdminNotificationCategory.SYSTEM,
        children: []
      },
      [AdminNotificationCategory.SECURITY]: {
        label: '安全类',
        value: AdminNotificationCategory.SECURITY,
        children: []
      }
    };

    // 根据通知类型枚举值，将其分配到对应的分类下
    for (const typeItem of notificationTypes) {
      // 字典中的code是大写+下划线，需要转换为小写+下划线来匹配枚举
      const typeCode = typeItem.code.toLowerCase() as AdminNotificationType;
      const typeName = typeItem.name['zh-CN'] || typeItem.name['en'] || typeCode;

      // 根据通知类型的业务含义确定其所属分类
      let category: AdminNotificationCategory;
      
      if (this.isReviewType(typeCode)) {
        category = AdminNotificationCategory.REVIEW;
      } else if (this.isBusinessType(typeCode)) {
        category = AdminNotificationCategory.BUSINESS;  
      } else if (this.isOperationType(typeCode)) {
        category = AdminNotificationCategory.OPERATION;
      } else if (this.isSecurityType(typeCode)) {
        category = AdminNotificationCategory.SECURITY;
      } else if (this.isSystemType(typeCode)) {
        category = AdminNotificationCategory.SYSTEM;
      } else {
        // 默认归类到系统类
        category = AdminNotificationCategory.SYSTEM;
      }

      categoryTypeMapping[category].children.push({
        label: typeName,
        value: typeCode // 使用小写的枚举值
      });
    }

    // 按照sortOrder对children排序
    for (const category of Object.values(categoryTypeMapping)) {
      category.children.sort((a, b) => {
        const aItem = notificationTypes.find(item => item.code.toLowerCase() === a.value);
        const bItem = notificationTypes.find(item => item.code.toLowerCase() === b.value);
        return (aItem?.sortOrder || 0) - (bItem?.sortOrder || 0);
      });
    }

    return Object.values(categoryTypeMapping);
  }

  /**
   * 判断是否为审核类通知
   */
  private isReviewType(type: AdminNotificationType): boolean {
    const reviewTypes = [
      AdminNotificationType.USER_REGISTRATION_PENDING,
      AdminNotificationType.COMPANY_REVIEW_PENDING,
      AdminNotificationType.PRODUCT_REVIEW_PENDING,
      AdminNotificationType.SAMPLE_REQUEST_PENDING,
      AdminNotificationType.REGISTRATION_REQUEST_PENDING,
      AdminNotificationType.COMPANY_APPROVED,
      AdminNotificationType.COMPANY_REJECTED,
      AdminNotificationType.PRODUCT_APPROVED,
      AdminNotificationType.PRODUCT_REJECTED,
    ];
    return reviewTypes.includes(type);
  }

  /**
   * 判断是否为业务类通知
   */
  private isBusinessType(type: AdminNotificationType): boolean {
    const businessTypes = [
      AdminNotificationType.INQUIRY_CREATED,
      AdminNotificationType.ORDER_STATUS_CHANGED,
      AdminNotificationType.USER_COMPLAINT,
      AdminNotificationType.FEEDBACK_RECEIVED,
      AdminNotificationType.BUSINESS_TRANSACTION_SUCCESS,
      AdminNotificationType.BUSINESS_TRANSACTION_FAILED,
    ];
    return businessTypes.includes(type);
  }

  /**
   * 判断是否为运营类通知
   */
  private isOperationType(type: AdminNotificationType): boolean {
    const operationTypes = [
      AdminNotificationType.VIP_EXPIRING_BATCH,
      AdminNotificationType.SUBSCRIPTION_METRICS,
      AdminNotificationType.BUSINESS_METRICS_ALERT,
      AdminNotificationType.REVENUE_ALERT,
    ];
    return operationTypes.includes(type);
  }

  /**
   * 判断是否为安全类通知
   */
  private isSecurityType(type: AdminNotificationType): boolean {
    const securityTypes = [
      AdminNotificationType.SECURITY_EVENT,
    ];
    return securityTypes.includes(type);
  }

  /**
   * 判断是否为系统类通知
   */
  private isSystemType(type: AdminNotificationType): boolean {
    const systemTypes = [
      AdminNotificationType.API_ERROR_RATE_HIGH,
      AdminNotificationType.DATABASE_CONNECTION_ERROR,
      AdminNotificationType.SYSTEM_RESOURCE_WARNING,
      AdminNotificationType.BACKUP_FAILED,
      AdminNotificationType.SYSTEM_MAINTENANCE,
      AdminNotificationType.VERSION_UPDATE,
      AdminNotificationType.FEATURE_ANNOUNCEMENT,
    ];
    return systemTypes.includes(type);
  }
}