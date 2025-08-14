import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { 
  AiConversation, 
  AiMessage, 
  AiWorkflowRun, 
  AiUsageStatistic,
  UserType,
  MessageType,
  WorkflowStatus
} from '../entities';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { StoreCompleteConversationDto } from './dto/store-conversation.dto';
import { ConversationStatsDto, ConversationStatsResponseDto } from './dto/conversation-stats.dto';
import { PopularQueriesDto, PopularQueriesResponseDto, PopularQueryItemDto } from './dto/popular-queries.dto';

@Injectable()
export class AiConversationsService {
  constructor(
    @InjectRepository(AiConversation)
    private readonly conversationRepository: Repository<AiConversation>,
    @InjectRepository(AiMessage)
    private readonly messageRepository: Repository<AiMessage>,
    @InjectRepository(AiWorkflowRun)
    private readonly workflowRunRepository: Repository<AiWorkflowRun>,
    @InjectRepository(AiUsageStatistic)
    private readonly usageStatisticRepository: Repository<AiUsageStatistic>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 存储完整的对话记录
   */
  async storeCompleteConversation(dto: StoreCompleteConversationDto): Promise<{
    conversationId: string;
    processed: boolean;
  }> {
    return this.dataSource.transaction(async (manager) => {
      // 1. 检查对话是否已存在
      let conversation = await manager.findOne(AiConversation, {
        where: { conversationId: dto.conversationId },
      });

      let isNewConversation = false;

      if (conversation) {
        // 对话已存在，检查是否为完全相同的问答对（幂等性处理）
        const existingUserMessage = await manager.findOne(AiMessage, {
          where: { 
            conversationId: dto.conversationId,
            messageType: MessageType.USER_QUERY,
            content: dto.userQuery
          },
        });

        if (existingUserMessage) {
          // 检查是否已有相同的AI回复
          const existingAiMessage = await manager.findOne(AiMessage, {
            where: { 
              conversationId: dto.conversationId,
              messageType: MessageType.AI_RESPONSE,
              content: dto.finalAnswer
            },
          });

          if (existingAiMessage) {
            // 完全相同的问答对已存在，直接返回
            return {
              conversationId: dto.conversationId,
              processed: false,
            };
          }
          
          // 相同问题但不同答案，允许添加新的回答
        }
        
        // 不同的查询，追加到现有对话中
        // 跳过创建对话记录，直接添加消息
      } else {
        // 2. 创建新的对话记录
        conversation = manager.create(AiConversation, {
          conversationId: dto.conversationId,
          guestId: dto.guestId,
          userType: dto.guestId ? UserType.GUEST : UserType.USER,
          title: this.generateTitle(dto.userQuery),
          userQuery: dto.userQuery,
          userInputs: dto.userInputs,
          finalAnswer: dto.finalAnswer,
          duration: dto.duration,
          totalMessages: 2, // 用户查询 + AI回复
          totalTokens: dto.usageStats?.totalTokens || 0,
          totalCost: parseFloat(dto.usageStats?.totalPrice || '0'),
        });

        await manager.save(conversation);
        isNewConversation = true;
      }

      // 3. 创建用户查询消息
      const userMessageId = this.generateUUID();
      const userMessage = manager.create(AiMessage, {
        messageId: userMessageId,
        conversationId: dto.conversationId,
        messageType: MessageType.USER_QUERY,
        content: dto.userQuery,
        metadata: dto.userInputs,
      });
      await manager.save(userMessage);

      // 4. 创建AI回复消息
      const aiMessageId = this.generateUUID();
      const aiMessage = manager.create(AiMessage, {
        messageId: aiMessageId,
        conversationId: dto.conversationId,
        messageType: MessageType.AI_RESPONSE,
        content: dto.finalAnswer,
        metadata: dto.streamMessages ? { streamMessages: dto.streamMessages } : undefined, // 流消息数据包装为对象
      });
      await manager.save(aiMessage);

      // 5. 更新对话统计信息（仅当追加到已有对话时）
      if (!isNewConversation) {
        // 计算新增的消息数和成本
        const additionalMessages = 2; // 用户查询 + AI回复
        const additionalTokens = dto.usageStats?.totalTokens || 0;
        const additionalCost = parseFloat(dto.usageStats?.totalPrice || '0');
        
        await manager.update(AiConversation, 
          { id: conversation.id },
          {
            totalMessages: () => `totalMessages + ${additionalMessages}`,
            totalTokens: () => `totalTokens + ${additionalTokens}`,
            totalCost: () => `totalCost + ${additionalCost}`,
            duration: dto.duration, // 更新为最新的持续时间
            updatedAt: new Date(),
          }
        );
      }

      // 6. 创建工作流运行记录（如果有）
      if (dto.workflowData) {
        const workflowRun = manager.create(AiWorkflowRun, {
          workflowRunId: dto.workflowData.id,
          conversationId: dto.conversationId,
          messageId: aiMessageId,
          workflowId: dto.workflowData.workflowId,
          status: dto.workflowData.status as WorkflowStatus,
          outputs: dto.workflowData.outputs,
          elapsedTime: dto.workflowData.elapsedTime,
          totalTokens: dto.workflowData.totalTokens,
          totalSteps: dto.workflowData.totalSteps,
          exceptionsCount: dto.workflowData.exceptionsCount,
          createdByUserId: dto.workflowData.createdBy?.id,
          finishedAt: new Date(dto.workflowData.finishedAt),
        });
        await manager.save(workflowRun);
      }

      // 7. 创建使用统计记录（如果有）
      if (dto.usageStats) {
        const usageStatistic = manager.create(AiUsageStatistic, {
          messageId: aiMessageId,
          conversationId: dto.conversationId,
          promptTokens: dto.usageStats.promptTokens,
          completionTokens: dto.usageStats.completionTokens,
          totalTokens: dto.usageStats.totalTokens,
          totalPrice: parseFloat(dto.usageStats.totalPrice),
          currency: dto.usageStats.currency,
          latency: dto.usageStats.latency,
        });
        await manager.save(usageStatistic);
      }

      return {
        conversationId: dto.conversationId,
        processed: true,
      };
    });
  }

  /**
   * 获取对话列表（支持用户和访客）
   */
  async findConversations(query: QueryConversationsDto): Promise<PaginatedResult<AiConversation>> {
    const queryBuilder = this.conversationRepository.createQueryBuilder('conversation');

    // 构建查询条件
    if (query.userId) {
      queryBuilder.andWhere('conversation.userId = :userId', { userId: query.userId });
    }

    if (query.guestId) {
      queryBuilder.andWhere('conversation.guestId = :guestId', { guestId: query.guestId });
    }

    if (query.userType) {
      queryBuilder.andWhere('conversation.userType = :userType', { userType: query.userType });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(conversation.title LIKE :search OR conversation.userQuery LIKE :search OR conversation.finalAnswer LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.startDate) {
      queryBuilder.andWhere('DATE(conversation.createdAt) >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('DATE(conversation.createdAt) <= :endDate', { endDate: query.endDate });
    }

    // 排序和分页
    const page = query.page || 1;
    const limit = query.limit || 20;
    
    queryBuilder
      .orderBy('conversation.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * 获取对话详情
   */
  async findConversationDetail(conversationId: string, userId?: number, guestId?: string): Promise<AiConversation> {
    const queryBuilder = this.conversationRepository.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('conversation.usageStatistics', 'usageStats')
      .where('conversation.conversationId = :conversationId', { conversationId });

    // 权限检查
    if (userId) {
      queryBuilder.andWhere('conversation.userId = :userId', { userId });
    } else if (guestId) {
      queryBuilder.andWhere('conversation.guestId = :guestId', { guestId });
    } else {
      // 如果既没有用户ID也没有访客ID，拒绝访问
      throw new NotFoundException('对话记录不存在或无权访问');
    }

    queryBuilder.orderBy('messages.createdAt', 'ASC');

    const conversation = await queryBuilder.getOne();
    if (!conversation) {
      throw new NotFoundException('对话记录不存在');
    }

    return conversation;
  }

  /**
   * 删除对话记录
   */
  async deleteConversation(conversationId: string, userId?: number, guestId?: string): Promise<void> {
    const queryBuilder = this.conversationRepository.createQueryBuilder('conversation')
      .where('conversation.conversationId = :conversationId', { conversationId });

    // 权限检查
    if (userId) {
      queryBuilder.andWhere('conversation.userId = :userId', { userId });
    } else if (guestId) {
      queryBuilder.andWhere('conversation.guestId = :guestId', { guestId });
    } else {
      throw new NotFoundException('对话记录不存在或无权访问');
    }

    const conversation = await queryBuilder.getOne();
    if (!conversation) {
      throw new NotFoundException('对话记录不存在');
    }

    await this.conversationRepository.softDelete({ id: conversation.id });
  }

  /**
   * 获取对话统计信息（管理员）
   */
  async getConversationStats(query: ConversationStatsDto): Promise<ConversationStatsResponseDto> {
    const queryBuilder = this.conversationRepository.createQueryBuilder('conversation');

    // 构建查询条件
    if (query.userType) {
      queryBuilder.andWhere('conversation.userType = :userType', { userType: query.userType });
    }

    if (query.startDate) {
      queryBuilder.andWhere('DATE(conversation.createdAt) >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('DATE(conversation.createdAt) <= :endDate', { endDate: query.endDate });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(conversation.title LIKE :search OR conversation.userQuery LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // 获取总体统计
    const totalStats = await queryBuilder
      .select([
        'COUNT(conversation.id) as totalConversations',
        'SUM(conversation.totalMessages) as totalMessages',
        'SUM(conversation.totalTokens) as totalTokens',
        'SUM(conversation.totalCost) as totalCost',
      ])
      .getRawOne();

    // 获取日统计
    const dailyStats = await queryBuilder
      .select([
        'DATE(conversation.createdAt) as date',
        'COUNT(conversation.id) as conversations',
        'SUM(conversation.totalMessages) as messages',
        'SUM(conversation.totalTokens) as tokens',
        'SUM(conversation.totalCost) as cost',
      ])
      .groupBy('DATE(conversation.createdAt)')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      totalConversations: parseInt(totalStats.totalConversations) || 0,
      totalMessages: parseInt(totalStats.totalMessages) || 0,
      totalTokens: parseInt(totalStats.totalTokens) || 0,
      totalCost: parseFloat(totalStats.totalCost) || 0,
      currency: 'USD',
      dailyStats: dailyStats.map(stat => ({
        date: stat.date,
        conversations: parseInt(stat.conversations) || 0,
        messages: parseInt(stat.messages) || 0,
        tokens: parseInt(stat.tokens) || 0,
        cost: parseFloat(stat.cost) || 0,
      })),
    };
  }

  /**
   * 获取热门咨询问题
   */
  async getPopularQueries(query: PopularQueriesDto): Promise<PopularQueriesResponseDto> {
    const limit = query.limit || 10;
    const minCount = query.minCount || 2;

    const queryBuilder = this.conversationRepository.createQueryBuilder('conversation')
      .select([
        'conversation.userQuery as query',
        'COUNT(conversation.userQuery) as count',
        'MAX(conversation.createdAt) as latestDate'
      ])
      .where('conversation.userQuery IS NOT NULL')
      .andWhere('conversation.userQuery != ""')
      .andWhere('LENGTH(conversation.userQuery) > 10') // 过滤过短的查询
      .groupBy('conversation.userQuery')
      .having('COUNT(conversation.userQuery) >= :minCount', { minCount })
      .orderBy('COUNT(conversation.userQuery)', 'DESC')
      .limit(limit);

    // 构建查询条件
    if (query.userType) {
      queryBuilder.andWhere('conversation.userType = :userType', { userType: query.userType });
    }

    if (query.startDate) {
      queryBuilder.andWhere('DATE(conversation.createdAt) >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('DATE(conversation.createdAt) <= :endDate', { endDate: query.endDate });
    }

    // 获取热门问题数据
    const popularQueries = await queryBuilder.getRawMany();

    // 获取总查询数用于计算百分比
    const totalQueryBuilder = this.conversationRepository.createQueryBuilder('conversation')
      .select('COUNT(*) as total')
      .where('conversation.userQuery IS NOT NULL')
      .andWhere('conversation.userQuery != ""');

    if (query.userType) {
      totalQueryBuilder.andWhere('conversation.userType = :userType', { userType: query.userType });
    }

    if (query.startDate) {
      totalQueryBuilder.andWhere('DATE(conversation.createdAt) >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      totalQueryBuilder.andWhere('DATE(conversation.createdAt) <= :endDate', { endDate: query.endDate });
    }

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalQueries = parseInt(totalResult.total) || 0;

    // 处理数据格式
    const data: PopularQueryItemDto[] = popularQueries.map(item => ({
      query: item.query,
      count: parseInt(item.count),
      latestDate: item.latestDate,
      percentage: totalQueries > 0 ? Math.round((parseInt(item.count) / totalQueries) * 10000) / 100 : 0
    }));

    return {
      data,
      totalQueries,
      dateRange: {
        startDate: query.startDate,
        endDate: query.endDate
      }
    };
  }

  /**
   * 生成对话标题
   */
  private generateTitle(userQuery: string): string {
    // 取用户查询的前50个字符作为标题
    if (!userQuery) return '未命名对话';
    return userQuery.length > 50 ? userQuery.substring(0, 50) + '...' : userQuery;
  }

  /**
   * 生成UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}