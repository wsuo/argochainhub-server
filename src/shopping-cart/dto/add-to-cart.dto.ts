import { IsNumber, IsString, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: '产品ID',
    example: 1
  })
  @IsNumber()
  @IsPositive()
  productId: number;

  @ApiProperty({
    description: '数量',
    example: 10
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: '单位',
    example: 'kg'
  })
  @IsString()
  unit: string;
}