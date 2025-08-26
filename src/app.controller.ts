import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('系统')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '系统欢迎信息' })
  @ApiResponse({ status: 200, description: '返回系统欢迎信息' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查端点' })
  @ApiResponse({ 
    status: 200, 
    description: '系统健康状态',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600.123 },
        environment: { type: 'string', example: 'production' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
