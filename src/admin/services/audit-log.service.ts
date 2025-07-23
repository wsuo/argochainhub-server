import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { AdminUser } from '../../entities/admin-user.entity';
import {
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditLogStatsDto,
  AuditLogExportDto,
  CreateAuditLogDto,
  AuditLogAnalyticsDto,
  AuditLogTrendDto
} from '../dto/audit-log.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { 
  AuditAction, 
  AuditResource, 
  AuditLogHelper, 
  AuditLogDetails 
} from '../../types/audit';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  /**
   * 记录审计日志
   */
  async createLog(dto: CreateAuditLogDto): Promise<void> {
    try {
      // 清理敏感信息
      const sanitizedDetails = dto.details ? 
        AuditLogHelper.sanitizeDetails(dto.details) : undefined;

      const auditLog = this.auditLogRepository.create({
        action: dto.action,
        targetResource: dto.targetResource,
        targetId: dto.targetId,
        details: sanitizedDetails,
        ipAddress: dto.ipAddress,
        adminUserId: dto.adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.auditLogRepository.save(auditLog);
      
      this.logger.log(
        `Audit log created: ${dto.action} ${dto.targetResource}:${dto.targetId} by admin:${dto.adminUserId}`
      );
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // 审计日志记录失败不应该影响主要业务逻辑
    }
  }

  /**
   * 查询审计日志
   */
  async findLogs(dto: AuditLogQueryDto): Promise<PaginatedResult<AuditLogResponseDto>> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.adminUser', 'adminUser')
      .orderBy('log.createdAt', 'DESC');

    // 条件过滤
    if (dto.action) {
      queryBuilder.andWhere('log.action = :action', { action: dto.action });
    }

    if (dto.targetResource) {
      queryBuilder.andWhere('log.targetResource = :targetResource', { 
        targetResource: dto.targetResource 
      });
    }

    if (dto.targetId) {
      queryBuilder.andWhere('log.targetId = :targetId', { targetId: dto.targetId });
    }

    if (dto.adminUserId) {
      queryBuilder.andWhere('log.adminUserId = :adminUserId', { 
        adminUserId: dto.adminUserId 
      });
    }

    if (dto.adminUsername) {
      queryBuilder.andWhere('adminUser.username LIKE :adminUsername', { 
        adminUsername: `%${dto.adminUsername}%` 
      });
    }

    if (dto.ipAddress) {
      queryBuilder.andWhere('log.ipAddress LIKE :ipAddress', { 
        ipAddress: `%${dto.ipAddress}%` 
      });
    }

    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);
      endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
      
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (dto.keyword) {
      queryBuilder.andWhere(
        '(JSON_EXTRACT(log.details, "$.reason") LIKE :keyword OR JSON_EXTRACT(log.details, "$.additionalInfo") LIKE :keyword)',
        { keyword: `%${dto.keyword}%` }
      );
    }

    // 分页
    const offset = (dto.page - 1) * dto.limit;
    queryBuilder.skip(offset).take(dto.limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    const items = logs.map(log => this.mapToResponseDto(log));

    return {
      items,
      total,
      page: dto.page,
      limit: dto.limit,
      totalPages: Math.ceil(total / dto.limit),
    };
  }

  /**
   * 获取审计日志统计信息
   */
  async getStats(): Promise<AuditLogStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 基础统计
    const [totalLogs, todayLogs, weekLogs, monthLogs] = await Promise.all([
      this.auditLogRepository.count(),
      this.auditLogRepository.count({
        where: { createdAt: Between(todayStart, now) }
      }),
      this.auditLogRepository.count({
        where: { createdAt: Between(weekStart, now) }
      }),
      this.auditLogRepository.count({
        where: { createdAt: Between(monthStart, now) }
      }),
    ]);

    // 操作类型统计
    const actionStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .getRawMany();

    const actionStatsWithPercentage = actionStats.map(stat => ({
      action: stat.action as AuditAction,
      actionDescription: AuditLogHelper.getActionDescription(stat.action),
      count: parseInt(stat.count),
      percentage: totalLogs > 0 ? Math.round((parseInt(stat.count) / totalLogs) * 100) : 0,
    }));

    // 资源类型统计
    const resourceStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.targetResource', 'resource')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.targetResource')
      .orderBy('count', 'DESC')
      .getRawMany();

    const resourceStatsWithPercentage = resourceStats.map(stat => ({
      resource: stat.resource as AuditResource,
      resourceDescription: AuditLogHelper.getResourceDescription(stat.resource),
      count: parseInt(stat.count),
      percentage: totalLogs > 0 ? Math.round((parseInt(stat.count) / totalLogs) * 100) : 0,
    }));

    // 活跃管理员统计（最近30天）
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeAdminStats = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.adminUserId', 'adminId')
      .addSelect('adminUser.username', 'adminUsername')
      .addSelect('COUNT(*)', 'operationCount')
      .addSelect('MAX(log.createdAt)', 'lastOperationAt')
      .leftJoin('log.adminUser', 'adminUser')
      .where('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('log.adminUserId')
      .addGroupBy('adminUser.username')
      .orderBy('operationCount', 'DESC')
      .limit(10)
      .getRawMany();

    const activeAdminStatsFormatted = activeAdminStats.map(stat => ({
      adminId: stat.adminId,
      adminUsername: stat.adminUsername,
      operationCount: parseInt(stat.operationCount),
      lastOperationAt: new Date(stat.lastOperationAt),
    }));

    return {
      totalLogs,
      todayLogs,
      weekLogs,
      monthLogs,
      actionStats: actionStatsWithPercentage,
      resourceStats: resourceStatsWithPercentage,
      activeAdminStats: activeAdminStatsFormatted,
    };
  }

  /**
   * 获取审计日志分析数据
   */
  async getAnalytics(days: number = 30): Promise<AuditLogAnalyticsDto> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 时间趋势分析
    const trends = await this.getTrends(startDate, now);

    // 最活跃的操作类型
    const topActions = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const totalOperations = topActions.reduce((sum, action) => sum + parseInt(action.count), 0);
    const topActionsFormatted = topActions.map(action => ({
      action: action.action as AuditAction,
      description: AuditLogHelper.getActionDescription(action.action),
      count: parseInt(action.count),
      percentage: totalOperations > 0 ? Math.round((parseInt(action.count) / totalOperations) * 100) : 0,
    }));

    // 最活跃的资源类型
    const topResources = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.targetResource', 'resource')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.targetResource')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topResourcesFormatted = topResources.map(resource => ({
      resource: resource.resource as AuditResource,
      description: AuditLogHelper.getResourceDescription(resource.resource),
      count: parseInt(resource.count),
      percentage: totalOperations > 0 ? Math.round((parseInt(resource.count) / totalOperations) * 100) : 0,
    }));

    // 最活跃的管理员
    const topAdmins = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.adminUserId', 'adminId')
      .addSelect('adminUser.username', 'username')
      .addSelect('adminUser.role', 'role')
      .addSelect('COUNT(*)', 'operationCount')
      .addSelect('MAX(log.createdAt)', 'lastOperation')
      .leftJoin('log.adminUser', 'adminUser')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.adminUserId')
      .addGroupBy('adminUser.username')
      .addGroupBy('adminUser.role')
      .orderBy('operationCount', 'DESC')
      .limit(10)
      .getRawMany();

    const topAdminsFormatted = topAdmins.map(admin => ({
      adminId: admin.adminId,
      username: admin.username,
      role: admin.role,
      operationCount: parseInt(admin.operationCount),
      lastOperation: new Date(admin.lastOperation),
    }));

    // 风险操作统计
    const riskActions = [AuditAction.DELETE, AuditAction.RESET_PASSWORD, AuditAction.ASSIGN_PERMISSION, AuditAction.SYSTEM_CONFIG];
    const riskStats = await Promise.all(
      riskActions.map(action =>
        this.auditLogRepository.count({
          where: {
            action,
            createdAt: Between(startDate, now)
          }
        })
      )
    );

    const riskOperations = {
      deletions: riskStats[0],
      passwordResets: riskStats[1],
      permissionChanges: riskStats[2],
      systemConfigs: riskStats[3],
    };

    // IP地址分布
    const ipDistribution = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.ipAddress', 'ipAddress')
      .addSelect('COUNT(*)', 'operationCount')
      .addSelect('COUNT(DISTINCT log.adminUserId)', 'uniqueAdmins')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.ipAddress')
      .orderBy('operationCount', 'DESC')
      .limit(10)
      .getRawMany();

    const ipDistributionFormatted = ipDistribution.map(ip => ({
      ipAddress: ip.ipAddress,
      operationCount: parseInt(ip.operationCount),
      uniqueAdmins: parseInt(ip.uniqueAdmins),
    }));

    return {
      trends,
      topActions: topActionsFormatted,
      topResources: topResourcesFormatted,
      topAdmins: topAdminsFormatted,
      riskOperations,
      ipDistribution: ipDistributionFormatted,
    };
  }

  /**
   * 导出审计日志
   */
  async exportLogs(dto: AuditLogExportDto): Promise<{ buffer: Buffer; filename: string }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.adminUser', 'adminUser')
      .orderBy('log.createdAt', 'DESC');

    // 应用过滤条件
    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (dto.actions && dto.actions.length > 0) {
      queryBuilder.andWhere('log.action IN (:...actions)', { actions: dto.actions });
    }

    if (dto.resources && dto.resources.length > 0) {
      queryBuilder.andWhere('log.targetResource IN (:...resources)', { resources: dto.resources });
    }

    if (dto.adminUserIds && dto.adminUserIds.length > 0) {
      queryBuilder.andWhere('log.adminUserId IN (:...adminUserIds)', { adminUserIds: dto.adminUserIds });
    }

    const logs = await queryBuilder.getMany();

    // 生成文件
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit_logs_${timestamp}.${dto.format}`;

    if (dto.format === 'csv') {
      const buffer = await this.generateCSV(logs);
      return { buffer, filename };
    } else {
      const buffer = await this.generateExcel(logs);
      return { buffer, filename };
    }
  }

  /**
   * 便捷方法：记录操作日志
   */
  async logOperation(
    action: AuditAction,
    resource: AuditResource,
    resourceId: number,
    adminUserId: number,
    ipAddress: string,
    details?: AuditLogDetails
  ): Promise<void> {
    await this.createLog({
      action,
      targetResource: resource,
      targetId: resourceId,
      details,
      ipAddress,
      adminUserId,
    });
  }

  // 私有辅助方法

  private mapToResponseDto(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action as AuditAction,
      actionDescription: AuditLogHelper.getActionDescription(log.action as AuditAction),
      targetResource: log.targetResource as AuditResource,
      targetResourceDescription: AuditLogHelper.getResourceDescription(log.targetResource as AuditResource),
      targetId: log.targetId,
      details: log.details,
      ipAddress: log.ipAddress,
      adminUserId: log.adminUserId,
      adminUser: {
        id: log.adminUser.id,
        username: log.adminUser.username,
        role: log.adminUser.role,
      },
      createdAt: log.createdAt,
    };
  }

  private async getTrends(startDate: Date, endDate: Date): Promise<AuditLogTrendDto[]> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trends: AuditLogTrendDto[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dayLogs = await this.auditLogRepository.find({
        where: {
          createdAt: Between(date, nextDate)
        }
      });

      const actionBreakdown: Record<AuditAction, number> = {} as any;
      Object.values(AuditAction).forEach(action => {
        actionBreakdown[action] = 0;
      });

      dayLogs.forEach(log => {
        const action = log.action as AuditAction;
        if (actionBreakdown[action] !== undefined) {
          actionBreakdown[action]++;
        }
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        count: dayLogs.length,
        actionBreakdown,
      });
    }

    return trends;
  }

  private async generateCSV(logs: AuditLog[]): Promise<Buffer> {
    const headers = [
      'ID',
      '操作时间',
      '操作类型',
      '资源类型',
      '资源ID',
      '操作管理员',
      'IP地址',
      '操作详情'
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.id.toString(),
        log.createdAt.toISOString(),
        AuditLogHelper.getActionDescription(log.action as AuditAction),
        AuditLogHelper.getResourceDescription(log.targetResource as AuditResource),
        log.targetId.toString(),
        log.adminUser?.username || '',
        log.ipAddress,
        JSON.stringify(log.details || {}).replace(/"/g, '""')
      ];
      csvRows.push(row.join(','));
    });

    return Buffer.from(csvRows.join('\n'), 'utf-8');
  }

  private async generateExcel(logs: AuditLog[]): Promise<Buffer> {
    // 这里应该使用 xlsx 库来生成 Excel 文件
    // 为了简化示例，我们返回 CSV 格式
    return this.generateCSV(logs);
  }
}