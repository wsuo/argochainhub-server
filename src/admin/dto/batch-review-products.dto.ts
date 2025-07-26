import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 单个产品审核项DTO
 */
export class ProductReviewItemDto {
  @ApiProperty({
    description: '产品ID',
    example: 1,
  })
  @IsNumber()
  productId: number;

  @ApiProperty({
    description: '是否批准',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: '审核原因',
    example: '产品信息完整，符合平台规范',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * 批量审核产品DTO
 */
export class BatchReviewProductsDto {
  @ApiProperty({
    description: '产品审核列表',
    type: [ProductReviewItemDto],
    example: [
      {
        productId: 1,
        approved: true,
        reason: '产品信息完整，符合平台规范'
      },
      {
        productId: 2,
        approved: false,
        reason: '产品信息不完整，请补充登记证信息'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductReviewItemDto)
  products: ProductReviewItemDto[];
}

/**
 * 批量审核结果DTO
 */
export class BatchReviewResultDto {
  @ApiProperty({
    description: '总处理数量',
    example: 10
  })
  total: number;

  @ApiProperty({
    description: '成功处理数量',
    example: 8
  })
  success: number;

  @ApiProperty({
    description: '失败处理数量',
    example: 2
  })
  failed: number;

  @ApiProperty({
    description: '成功处理的产品ID列表',
    example: [1, 2, 3, 4, 5, 6, 7, 8]
  })
  successIds: number[];

  @ApiProperty({
    description: '失败处理的详情',
    example: [
      { productId: 9, error: '产品不存在' },
      { productId: 10, error: '产品不在待审核状态' }
    ]
  })
  failures: Array<{
    productId: number;
    error: string;
  }>;
}