import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Query, 
  Body,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiConversationsService } from './ai-conversations.service';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import { StoreCompleteConversationDto } from './dto/store-conversation.dto';
import { ResponseWrapperUtil } from '../common/utils/response-wrapper.util';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities';

@ApiTags('AI对话记录')
@Controller('ai/conversations')
export class AiConversationsController {
  constructor(private readonly conversationsService: AiConversationsService) {}

  @Post('store-complete')
  @ApiOperation({ summary: '存储完整对话记录' })
  @ApiResponse({ status: 201, description: '对话记录存储成功' })
  async storeCompleteConversation(@Body() dto: StoreCompleteConversationDto) {
    const result = await this.conversationsService.storeCompleteConversation(dto);
    return ResponseWrapperUtil.success(result, '对话记录保存成功');
  }

  @Get()
  @UseGuards(FlexibleAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取对话列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getConversations(
    @Query() query: QueryConversationsDto,
    @CurrentUser() user?: User,
  ) {
    // 如果是登录用户，设置用户ID
    if (user) {
      query.userId = user.id;
    }

    const result = await this.conversationsService.findConversations(query);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get('guest/:guestId')
  @ApiOperation({ summary: '获取访客对话列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getGuestConversations(
    @Param('guestId') guestId: string,
    @Query() query: QueryConversationsDto,
  ) {
    query.guestId = guestId;
    const result = await this.conversationsService.findConversations(query);
    return ResponseWrapperUtil.successWithPagination(result, '查询成功');
  }

  @Get(':conversationId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '获取对话详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getConversationDetail(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('guest_id') guestId?: string,
    @CurrentUser() user?: User,
  ) {
    const result = await this.conversationsService.findConversationDetail(
      conversationId,
      user?.id,
      guestId,
    );
    return ResponseWrapperUtil.success(result, '查询成功');
  }

  @Delete(':conversationId')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '删除对话记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('guest_id') guestId?: string,
    @CurrentUser() user?: User,
  ) {
    await this.conversationsService.deleteConversation(
      conversationId,
      user?.id,
      guestId,
    );
    return ResponseWrapperUtil.successNoData('对话删除成功');
  }
}