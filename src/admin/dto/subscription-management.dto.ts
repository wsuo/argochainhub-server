import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsDate,
  IsString,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @ApiProperty({ description: '企业ID' })
  @IsNumber()
  @IsPositive()
  companyId: number;

  @ApiProperty({ description: '会员计划ID' })
  @IsNumber()
  @IsPositive()
  planId: number;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ description: '赠送原因', required: false })
  @IsOptional()
  @IsString()
  giftReason?: string;
}
