import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewCompanyDto {
  @ApiProperty({
    description: '是否批准',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: '审核原因',
    example: '企业资质符合要求',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
