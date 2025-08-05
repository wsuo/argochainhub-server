import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  AiConversation, 
  AiMessage, 
  AiWorkflowRun, 
  AiUsageStatistic 
} from '../entities';
import { AiConversationsService } from './ai-conversations.service';
import { AiConversationsController } from './ai-conversations.controller';
import { AiConversationsAdminController } from './admin/ai-conversations-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversation,
      AiMessage,
      AiWorkflowRun,
      AiUsageStatistic,
    ]),
  ],
  controllers: [
    AiConversationsController,
    AiConversationsAdminController,
  ],
  providers: [AiConversationsService],
  exports: [AiConversationsService],
})
export class AiConversationsModule {}