import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPesticidesDto {
  @ApiProperty({ 
    description: '页码',
    example: 1,
    required: false,
    default: 1
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    description: '每页数量',
    example: 20,
    required: false,
    default: 20
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({ 
    description: '产品类别筛选',
    example: 'insecticide',
    required: false
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ 
    description: '剂型筛选',
    example: 'TC',
    required: false
  })
  @IsString()
  @IsOptional()
  formulation?: string;

  @ApiProperty({ 
    description: '是否只显示可见的农药',
    example: true,
    required: false
  })
  @IsOptional()
  isVisible?: boolean | string;

  @ApiProperty({ 
    description: '产品名称搜索（支持中文、英文、西班牙文）',
    example: '氯氰菊酯',
    required: false
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ 
    description: '是否有价格数据筛选（true: 仅显示有价格的, false: 仅显示无价格的）',
    example: true,
    required: false
  })
  @IsOptional()
  hasPrice?: boolean | string;
}