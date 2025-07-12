import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: '会员计划ID' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  planId: number;
}