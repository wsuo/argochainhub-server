import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('会员计划')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: '获取所有可用会员计划' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getActivePlans() {
    return this.plansService.getActivePlans();
  }
}