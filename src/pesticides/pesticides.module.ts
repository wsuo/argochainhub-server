import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { StandardPesticide } from '../entities/standard-pesticide.entity';
import { PesticidePriceTrend } from '../entities/pesticide-price-trend.entity';
import { PesticidesService } from './pesticides.service';
import { PriceTrendsService } from './price-trends.service';
import { ImageParseService } from './image-parse.service';
import { PesticidesController } from './pesticides.controller';
import { PriceTrendsController } from './price-trends.controller';
import { ImageParseController } from './image-parse.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StandardPesticide, PesticidePriceTrend]),
    ConfigModule,
    RouterModule.register([
      {
        path: 'admin',
        module: PesticidesModule,
      },
    ]),
  ],
  controllers: [
    PesticidesController,
    PriceTrendsController,
    ImageParseController,
  ],
  providers: [
    PesticidesService,
    PriceTrendsService,
    ImageParseService,
  ],
  exports: [
    PesticidesService,
    PriceTrendsService,
    ImageParseService,
  ],
})
export class PesticidesModule {}