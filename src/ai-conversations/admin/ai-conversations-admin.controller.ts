import { 
  Controller, 
  Get, 
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiConversationsService } from '../ai-conversations.service';
import { QueryConversationsDto } from '../dto/query-conversations.dto';
import { ConversationStatsDto } from '../dto/conversation-stats.dto';
import { ResponseWrapperUtil } from '../../common/utils/response-wrapper.util';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminPermissions } from '../../common/decorators/admin-permissions.decorator';
import { AdminPermission } from '../../types/permissions';

@ApiTags('AI对话记录管理')
@Controller('admin/ai/conversations')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AiConversationsAdminController {
  constructor(private readonly conversationsService: AiConversationsService) {}

  @Get()
  @AdminPermissions(AdminPermission.ANALYTICS_VIEW)
  @ApiOperation({ summary: '获取所有对话列表（管理员）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllConversations(@Query() query: QueryConversationsDto) {
    const result = await this.conversationsService.findConversations(query);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get('stats')
  @AdminPermissions(AdminPermission.ANALYTICS_VIEW)
  @ApiOperation({ summary: '获取对话统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getConversationStats(@Query() query: ConversationStatsDto) {
    const result = await this.conversationsService.getConversationStats(query);
    return ResponseWrapperUtil.success(result, '查询成功');
  }
}