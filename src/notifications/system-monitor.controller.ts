import {
  Controller,
  Get,
  Post,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SystemMonitorService, SystemMetrics } from './system-monitor.service';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { AdminPermissions } from '../common/decorators/admin-permissions.decorator';
import { AdminPermissionsGuard } from '../common/guards/admin-permissions.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AdminUser } from '../entities/admin-user.entity';
import { AdminPermission } from '../types/permissions';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';

@ApiTags('系统监控')
@Controller('admin/system-monitor')
@UseGuards(AdminAuthGuard, AdminPermissionsGuard)
@ApiBearerAuth()
export class SystemMonitorController {
  constructor(private readonly systemMonitorService: SystemMonitorService) {}

  @Get('metrics')
  @ApiOperation({ summary: '获取当前系统指标' })
  @AdminPermissions(AdminPermission.SYSTEM_CONFIG)
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        dbConnectionStatus: { enum: ['healthy', 'warning', 'critical'] },
        dbConnectionCount: { type: 'number' },
        memoryUsage: {
          type: 'object',
          properties: {
            used: { type: 'number' },
            total: { type: 'number' },
            percentage: { type: 'number' },
          },
        },
        diskUsage: {
          type: 'object',
          properties: {
            used: { type: 'number' },
            total: { type: 'number' },
            percentage: { type: 'number' },
          },
        },
        businessMetrics: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            pendingCompanies: { type: 'number' },
            pendingProducts: { type: 'number' },
            recentErrors: { type: 'number' },
          },
        },
        cpuUsage: {
          type: 'array',
          items: { type: 'number' },
        },
        uptime: { type: 'number' },
      },
    },
  })
  async getSystemMetrics() {
    const metrics = await this.systemMonitorService.getSystemMetrics();
    return ResponseWrapperUtil.success(metrics, '系统指标获取成功');
  }

  @Post('health-check')
  @ApiOperation({ summary: '手动触发系统健康检查' })
  @AdminPermissions(AdminPermission.SYSTEM_CONFIG)
  @ApiResponse({ status: 200, description: '健康检查完成' })
  async triggerHealthCheck(@CurrentAdmin() adminUser: AdminUser) {
    const metrics = await this.systemMonitorService.triggerHealthCheck();
    return ResponseWrapperUtil.success(
      {
        metrics,
        triggeredBy: adminUser.username,
        triggeredAt: new Date(),
      },
      '系统健康检查已完成'
    );
  }

  @Get('status')
  @ApiOperation({ summary: '获取系统整体状态概览' })
  @AdminPermissions(AdminPermission.DASHBOARD_VIEW)
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSystemStatus() {
    const metrics = await this.systemMonitorService.getSystemMetrics();
    
    // 计算整体健康度评分
    const healthScore = this.calculateHealthScore(metrics);
    
    // 生成状态概览
    const status = {
      overallHealth: this.getHealthLevel(healthScore),
      healthScore,
      timestamp: new Date(),
      summary: {
        database: metrics.dbConnectionStatus,
        memory: this.getResourceStatus(metrics.memoryUsage.percentage),
        disk: this.getResourceStatus(metrics.diskUsage.percentage),
        cpu: this.getCpuStatus(metrics.cpuUsage[0]),
        business: {
          pendingReviews: metrics.businessMetrics.pendingCompanies + metrics.businessMetrics.pendingProducts,
          userActivity: `${metrics.businessMetrics.activeUsers}/${metrics.businessMetrics.totalUsers}`,
        },
      },
      alerts: this.generateAlerts(metrics),
    };

    return ResponseWrapperUtil.success(status, '系统状态获取成功');
  }

  @Delete('alert-cooldowns')
  @ApiOperation({ summary: '清除所有告警冷却期' })
  @AdminPermissions(AdminPermission.SYSTEM_CONFIG)
  @ApiResponse({ status: 200, description: '清除成功' })
  async clearAlertCooldowns(@CurrentAdmin() adminUser: AdminUser) {
    this.systemMonitorService.clearAlertCooldowns();
    return ResponseWrapperUtil.success(
      { clearedBy: adminUser.username, clearedAt: new Date() },
      '告警冷却期已清除'
    );
  }

  @Post('alert-cooldown/:alertType/:minutes')
  @ApiOperation({ summary: '为特定告警类型设置冷却期' })
  @AdminPermissions(AdminPermission.SYSTEM_CONFIG)
  @ApiParam({ name: 'alertType', description: '告警类型' })
  @ApiParam({ name: 'minutes', description: '冷却期分钟数' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAlertCooldown(
    @Param('alertType') alertType: string,
    @Param('minutes') minutes: string,
    @CurrentAdmin() adminUser: AdminUser,
  ) {
    const cooldownMs = parseInt(minutes) * 60 * 1000;
    this.systemMonitorService.setAlertCooldown(alertType, cooldownMs);
    
    return ResponseWrapperUtil.success(
      {
        alertType,
        cooldownMinutes: parseInt(minutes),
        setBy: adminUser.username,
        setAt: new Date(),
      },
      `告警 ${alertType} 冷却期已设置为 ${minutes} 分钟`
    );
  }

  @Get('health-history')
  @ApiOperation({ summary: '获取系统健康历史趋势（模拟数据）' })
  @AdminPermissions(AdminPermission.ANALYTICS_VIEW)
  @ApiResponse({ status: 200, description: '获取成功' })
  async getHealthHistory() {
    // 这里可以实现真实的历史数据查询
    // 目前返回模拟数据示例
    const now = new Date();
    const history: Array<{
      timestamp: Date;
      healthScore: number;
      memoryUsage: number;
      cpuUsage: number;
      diskUsage: number;
    }> = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      history.push({
        timestamp,
        healthScore: 85 + Math.random() * 10,
        memoryUsage: 60 + Math.random() * 20,
        cpuUsage: 30 + Math.random() * 30,
        diskUsage: 45 + Math.random() * 10,
      });
    }

    return ResponseWrapperUtil.success(
      {
        period: '24小时',
        dataPoints: history,
      },
      '系统健康历史数据获取成功'
    );
  }

  private calculateHealthScore(metrics: SystemMetrics): number {
    let score = 100;
    
    // 数据库状态权重 30%
    if (metrics.dbConnectionStatus === 'critical') {
      score -= 30;
    } else if (metrics.dbConnectionStatus === 'warning') {
      score -= 15;
    }
    
    // 内存使用权重 25%
    if (metrics.memoryUsage.percentage > 90) {
      score -= 25;
    } else if (metrics.memoryUsage.percentage > 80) {
      score -= 15;
    } else if (metrics.memoryUsage.percentage > 70) {
      score -= 8;
    }
    
    // CPU使用权重 20%
    const cpuCores = require('os').cpus().length;
    const cpuUsage = (metrics.cpuUsage[0] / cpuCores) * 100;
    if (cpuUsage > 90) {
      score -= 20;
    } else if (cpuUsage > 80) {
      score -= 12;
    } else if (cpuUsage > 70) {
      score -= 6;
    }
    
    // 磁盘使用权重 15%
    if (metrics.diskUsage.percentage > 95) {
      score -= 15;
    } else if (metrics.diskUsage.percentage > 85) {
      score -= 10;
    } else if (metrics.diskUsage.percentage > 75) {
      score -= 5;
    }
    
    // 业务指标权重 10%
    const pendingItems = metrics.businessMetrics.pendingCompanies + metrics.businessMetrics.pendingProducts;
    if (pendingItems > 100) {
      score -= 10;
    } else if (pendingItems > 50) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getHealthLevel(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  private getResourceStatus(percentage: number): 'healthy' | 'warning' | 'critical' {
    if (percentage >= 90) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'healthy';
  }

  private getCpuStatus(load: number): 'healthy' | 'warning' | 'critical' {
    const cpuCores = require('os').cpus().length;
    const percentage = (load / cpuCores) * 100;
    
    if (percentage >= 90) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'healthy';
  }

  private generateAlerts(metrics: SystemMetrics): string[] {
    const alerts: string[] = [];
    
    if (metrics.dbConnectionStatus === 'critical') {
      alerts.push('数据库连接异常');
    }
    
    if (metrics.memoryUsage.percentage > 90) {
      alerts.push(`内存使用率过高: ${metrics.memoryUsage.percentage}%`);
    }
    
    if (metrics.diskUsage.percentage > 90) {
      alerts.push(`磁盘空间不足: ${metrics.diskUsage.percentage}%`);
    }
    
    const pendingReviews = metrics.businessMetrics.pendingCompanies + metrics.businessMetrics.pendingProducts;
    if (pendingReviews > 50) {
      alerts.push(`待审核项目积压: ${pendingReviews} 项`);
    }
    
    return alerts;
  }
}