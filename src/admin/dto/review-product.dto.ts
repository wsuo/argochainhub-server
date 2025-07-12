import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewProductDto {
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
