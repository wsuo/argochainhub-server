import { IsNumber, IsString, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: '数量',
    example: 15
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