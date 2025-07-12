import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultiLangText } from '../../types/multilang';

class PlanSpecsDto {
  @ApiProperty({ description: '用户账户数量', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  userAccounts?: number;

  @ApiProperty({ description: '每月AI查询次数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiQueriesMonthly?: number;

  @ApiProperty({ description: '每月询价次数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inquiriesMonthly?: number;

  @ApiProperty({ description: '每月样品申请次数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sampleRequestsMonthly?: number;

  @ApiProperty({ description: '每月登记申请次数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationRequestsMonthly?: number;

  @ApiProperty({ description: '产品数量限制', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productsLimit?: number;

  @ApiProperty({ description: '支持级别', required: false })
  @IsOptional()
  supportLevel?: string;
}

export class CreatePlanDto {
  @ApiProperty({ description: '计划名称（多语言）' })
  @IsObject()
  name: MultiLangText;

  @ApiProperty({ description: '价格' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: '有效期天数' })
  @IsNumber()
  @IsPositive()
  durationDays: number;

  @ApiProperty({ description: '是否上架', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '计划规格', type: PlanSpecsDto })
  @ValidateNested()
  @Type(() => PlanSpecsDto)
  specs: PlanSpecsDto;
}

export class UpdatePlanDto {
  @ApiProperty({ description: '计划名称（多语言）', required: false })
  @IsOptional()
  @IsObject()
  name?: MultiLangText;

  @ApiProperty({ description: '价格', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: '有效期天数', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationDays?: number;

  @ApiProperty({ description: '是否上架', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '计划规格', type: PlanSpecsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanSpecsDto)
  specs?: PlanSpecsDto;
}
