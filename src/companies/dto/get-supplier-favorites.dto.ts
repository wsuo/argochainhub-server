import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetSupplierFavoritesDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: '搜索关键词（供应商名称）',
    example: '农业'
  })
  @IsOptional()
  @IsString()
  search?: string;
}