import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AddSupplierFavoriteDto {
  @ApiProperty({ 
    description: '供应商ID', 
    example: 26 
  })
  @IsNumber()
  @Type(() => Number)
  supplierId: number;

  @ApiPropertyOptional({ 
    description: '收藏备注', 
    example: '优质的农药供应商，产品齐全' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注不能超过500个字符' })
  note?: string;
}

export class UpdateSupplierFavoriteDto {
  @ApiPropertyOptional({ 
    description: '收藏备注', 
    example: '更新后的备注信息' 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注不能超过500个字符' })
  note?: string;
}