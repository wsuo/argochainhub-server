import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchRemoveFromCartDto {
  @ApiProperty({
    description: '要删除的购物车项目ID列表',
    example: [1, 2, 3]
  })
  @IsArray()
  cartItemIds: number[];
}