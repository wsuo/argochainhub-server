import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TosService } from './tos.service';
import { StorageService } from './storage.service';
import tosConfig from '../config/tos.config';

@Module({
  imports: [
    ConfigModule.forFeature(tosConfig),
  ],
  providers: [TosService, StorageService],
  exports: [StorageService],
})
export class StorageModule {}