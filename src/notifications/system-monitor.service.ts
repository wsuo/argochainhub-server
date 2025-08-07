import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AdminNotificationsService } from './admin-notifications.service';
import { User } from '../entities/user.entity';
import { Company, CompanyStatus } from '../entities/company.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Inquiry } from '../entities/inquiry.entity';
import * as os from 'os';
import * as fs from 'fs';

export interface SystemMetrics {
  // 数据库指标
  dbConnectionStatus: 'healthy' | 'warning' | 'critical';
  dbConnectionCount: number;
  
  // 内存指标
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // 磁盘指标
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // 业务指标
  businessMetrics: {
    totalUsers: number;
    activeUsers: number;
    pendingCompanies: number;
    pendingProducts: number;
    recentErrors: number;
  };
  
  // 系统负载
  cpuUsage: number[];
  uptime: number;
}

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);
  private lastAlertTimes = new Map<string, Date>();
  private readonly ALERT_COOLDOWN = 30 * 60 * 1000; // 30分钟冷却期

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    private readonly dataSource: DataSource,
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async performSystemHealthCheck() {
    try {
      this.logger.debug('执行系统健康检查');
      const metrics = await this.collectSystemMetrics();
      await this.analyzeAndAlert(metrics);
    } catch (error) {
      this.logger.error('系统健康检查失败:', error);
      await this.sendAlert('SYSTEM_ERROR', '系统监控服务异常', 'critical');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async performDetailedSystemAnalysis() {
    try {
      this.logger.debug('执行详细系统分析');
      const metrics = await this.collectSystemMetrics();
      
      // 检查业务指标异常
      await this.checkBusinessMetricsAnomalies(metrics.businessMetrics);
      
      // 检查性能趋势
      await this.checkPerformanceTrends(metrics);
    } catch (error) {
      this.logger.error('详细系统分析失败:', error);
    }
  }

  async collectSystemMetrics(): Promise<SystemMetrics> {
    const [
      dbStatus,
      memoryUsage,
      diskUsage,
      businessMetrics
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.getMemoryUsage(),
      this.getDiskUsage(),
      this.getBusinessMetrics(),
    ]);

    return {
      dbConnectionStatus: dbStatus.status,
      dbConnectionCount: dbStatus.connectionCount,
      memoryUsage,
      diskUsage,
      businessMetrics,
      cpuUsage: os.loadavg(),
      uptime: os.uptime(),
    };
  }

  private async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    connectionCount: number;
  }> {
    try {
      // 检查数据库连接
      const queryResult = await this.dataSource.query('SELECT 1 as test');
      if (!queryResult || queryResult.length === 0) {
        return { status: 'critical', connectionCount: 0 };
      }

      // 简化连接数检查，因为TypeORM连接池信息不易获取
      const connectionCount = this.dataSource.isInitialized ? 1 : 0;
      
      // 基于连接状态返回健康度
      if (!this.dataSource.isInitialized) {
        return { status: 'critical', connectionCount: 0 };
      }

      return { status: 'healthy', connectionCount };
    } catch (error) {
      this.logger.error('数据库健康检查失败:', error);
      return { status: 'critical', connectionCount: 0 };
    }
  }

  private getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // 注意：在macOS/Linux中，os.freemem()返回的是系统认为可用的内存
    // 这已经考虑了缓存和缓冲区，所以计算相对准确
    // 但为了避免误报，我们使用更保守的阈值
    const percentage = Math.round((usedMemory / totalMemory) * 100);
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.min(percentage, 100), // 确保不超过100%
    };
  }

  private async getDiskUsage() {
    try {
      const stats = await fs.promises.statfs('./');
      // 修复磁盘使用率计算
      // stats.blocks: 总块数
      // stats.bfree: 空闲块数  
      // stats.bavail: 普通用户可用块数
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      
      return {
        used,
        total,
        percentage: Math.round((used / total) * 100),
      };
    } catch (error) {
      this.logger.warn('获取磁盘使用情况失败:', error);
      return {
        used: 0,
        total: 0,
        percentage: 0,
      };
    }
  }

  private async getBusinessMetrics() {
    const [
      totalUsers,
      activeUsers,
      pendingCompanies,
      pendingProducts
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.companyRepository.count({ where: { status: CompanyStatus.PENDING_REVIEW } }),
      this.productRepository.count({ where: { status: ProductStatus.PENDING_REVIEW } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingCompanies,
      pendingProducts,
      recentErrors: 0, // TODO: 可以从日志系统获取
    };
  }

  private async analyzeAndAlert(metrics: SystemMetrics) {
    // 数据库告警
    if (metrics.dbConnectionStatus === 'critical') {
      await this.sendAlert(
        'DATABASE_CRITICAL',
        `数据库连接严重异常，连接数: ${metrics.dbConnectionCount}`,
        'critical'
      );
    } else if (metrics.dbConnectionStatus === 'warning') {
      await this.sendAlert(
        'DATABASE_WARNING',
        `数据库连接池使用率较高，连接数: ${metrics.dbConnectionCount}`,
        'warning'
      );
    }

    // 内存告警 - 调整阈值，因为macOS内存管理比较激进
    if (metrics.memoryUsage.percentage > 95) {
      await this.sendAlert(
        'MEMORY_CRITICAL',
        `内存使用率严重过高: ${metrics.memoryUsage.percentage}% (已用: ${Math.round(metrics.memoryUsage.used / 1024 / 1024 / 1024 * 10) / 10}GB / 总计: ${Math.round(metrics.memoryUsage.total / 1024 / 1024 / 1024 * 10) / 10}GB)`,
        'critical'
      );
    } else if (metrics.memoryUsage.percentage > 90) {
      await this.sendAlert(
        'MEMORY_WARNING',
        `内存使用率较高: ${metrics.memoryUsage.percentage}% (已用: ${Math.round(metrics.memoryUsage.used / 1024 / 1024 / 1024 * 10) / 10}GB / 总计: ${Math.round(metrics.memoryUsage.total / 1024 / 1024 / 1024 * 10) / 10}GB)`,
        'warning'
      );
    }

    // 磁盘告警
    if (metrics.diskUsage.percentage > 95) {
      await this.sendAlert(
        'DISK_CRITICAL',
        `磁盘空间严重不足: ${metrics.diskUsage.percentage}%`,
        'critical'
      );
    } else if (metrics.diskUsage.percentage > 85) {
      await this.sendAlert(
        'DISK_WARNING',
        `磁盘空间不足: ${metrics.diskUsage.percentage}%`,
        'warning'
      );
    }

    // CPU负载告警 - 修复load average的理解和告警逻辑
    const [load1, load5, load15] = metrics.cpuUsage;
    const cpuCores = os.cpus().length;
    
    // Load average表示等待CPU的进程数，不是CPU使用率百分比
    // 通常 load = cpuCores 表示CPU满载
    // load > cpuCores 表示有进程在等待
    const loadRatio = load1 / cpuCores;
    
    if (loadRatio > 2.0) {
      await this.sendAlert(
        'CPU_CRITICAL',
        `CPU负载过高: ${load1.toFixed(2)} (核心数: ${cpuCores}, 负载比率: ${loadRatio.toFixed(2)})`,
        'critical'
      );
    } else if (loadRatio > 1.5) {
      await this.sendAlert(
        'CPU_WARNING',
        `CPU负载较高: ${load1.toFixed(2)} (核心数: ${cpuCores}, 负载比率: ${loadRatio.toFixed(2)})`,
        'warning'
      );
    }
  }

  private async checkBusinessMetricsAnomalies(businessMetrics: {
    totalUsers: number;
    activeUsers: number;
    pendingCompanies: number;
    pendingProducts: number;
    recentErrors: number;
  }) {
    // 检查待审核企业数量异常增长
    if (businessMetrics.pendingCompanies > 50) {
      await this.sendAlert(
        'BUSINESS_COMPANIES_BACKLOG',
        `待审核企业数量异常: ${businessMetrics.pendingCompanies} 家企业待审核`,
        'warning'
      );
    }

    // 检查待审核产品数量异常增长
    if (businessMetrics.pendingProducts > 100) {
      await this.sendAlert(
        'BUSINESS_PRODUCTS_BACKLOG',
        `待审核产品数量异常: ${businessMetrics.pendingProducts} 个产品待审核`,
        'warning'
      );
    }

    // 检查用户活跃度异常
    const activeRate = (businessMetrics.activeUsers / businessMetrics.totalUsers) * 100;
    if (activeRate < 50) {
      await this.sendAlert(
        'BUSINESS_USER_ACTIVITY_LOW',
        `用户活跃度偏低: ${activeRate.toFixed(2)}% (${businessMetrics.activeUsers}/${businessMetrics.totalUsers})`,
        'warning'
      );
    }
  }

  private async checkPerformanceTrends(metrics: SystemMetrics) {
    // 这里可以实现更复杂的趋势分析
    // 例如与历史数据对比，检测性能下降趋势等
    this.logger.debug('性能趋势分析完成', {
      uptime: metrics.uptime,
      cpuLoad: metrics.cpuUsage[0],
      memoryUsage: metrics.memoryUsage.percentage,
    });
  }

  private async sendAlert(
    alertType: string,
    message: string,
    level: 'warning' | 'error' | 'critical' = 'warning'
  ) {
    // 检查冷却期，避免重复发送相同类型的告警
    const lastAlertTime = this.lastAlertTimes.get(alertType);
    const now = new Date();
    
    if (lastAlertTime && now.getTime() < lastAlertTime.getTime()) {
      this.logger.debug(`告警 ${alertType} 在冷却期内，跳过发送 (冷却期到: ${lastAlertTime.toISOString()})`);
      return;
    }

    try {
      await this.adminNotificationsService.notifySystemAlert(alertType, message, level);
      
      // 设置冷却期到未来30分钟
      const cooldownEnd = new Date(now.getTime() + this.ALERT_COOLDOWN);
      this.lastAlertTimes.set(alertType, cooldownEnd);
      
      this.logger.log(`系统告警已发送: ${alertType} - ${message} (下次可发送时间: ${cooldownEnd.toISOString()})`);
    } catch (error) {
      this.logger.error('发送系统告警失败:', error);
    }
  }

  // 手动触发系统健康检查的方法
  async triggerHealthCheck(): Promise<SystemMetrics> {
    this.logger.log('手动触发系统健康检查');
    const metrics = await this.collectSystemMetrics();
    await this.analyzeAndAlert(metrics);
    return metrics;
  }

  // 获取系统指标（不触发告警）
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.collectSystemMetrics();
  }

  // 清除告警冷却期
  clearAlertCooldowns() {
    this.lastAlertTimes.clear();
    this.logger.log('告警冷却期已清除');
  }

  // 设置特定告警类型的冷却期
  setAlertCooldown(alertType: string, cooldownMs: number = this.ALERT_COOLDOWN) {
    const futureTime = new Date(Date.now() + cooldownMs);
    this.lastAlertTimes.set(alertType, futureTime);
    this.logger.log(`设置告警 ${alertType} 冷却期到 ${futureTime.toISOString()}`);
  }
}