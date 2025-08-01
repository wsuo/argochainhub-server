import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('会员计划')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: '获取所有可用会员计划' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivePlans() {
    const plans = await this.plansService.getActivePlans();
    return ResponseWrapperUtil.success(plans, '获取成功');
  }
}
