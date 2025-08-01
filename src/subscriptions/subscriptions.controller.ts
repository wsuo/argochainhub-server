import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('订阅管理')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @ApiOperation({ summary: '获取当前订阅状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCurrentSubscription(@CurrentUser() user: User) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(user);
    return ResponseWrapperUtil.success(subscription, '获取成功');
  }

  @Get('quota')
  @ApiOperation({ summary: '获取配额使用情况' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getQuotaUsage(@CurrentUser() user: User) {
    const quotaUsage = await this.subscriptionsService.getQuotaUsage(user);
    return ResponseWrapperUtil.success(quotaUsage, '获取成功');
  }

  @Post('trial')
  @ApiOperation({ summary: '创建试用订阅' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: { type: 'number', example: 1 },
      },
      required: ['planId'],
    },
  })
  @ApiResponse({ status: 201, description: '试用订阅创建成功' })
  @ApiResponse({ status: 400, description: '试用订阅已存在' })
  async createTrialSubscription(
    @CurrentUser() user: User,
    @Body('planId', ParseIntPipe) planId: number,
  ) {
    const result = await this.subscriptionsService.createTrialSubscription(user, planId);
    return ResponseWrapperUtil.success(result, '试用订阅创建成功');
  }

  @Delete('cancel')
  @ApiOperation({ summary: '取消当前订阅' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 404, description: '未找到活跃订阅' })
  async cancelSubscription(@CurrentUser() user: User) {
    const result = await this.subscriptionsService.cancelSubscription(user);
    return ResponseWrapperUtil.success(result, '订阅取消成功');
  }
}
