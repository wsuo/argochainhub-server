import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductStatus } from '../../entities/product.entity';

export class MyProductsDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, description: '产品状态' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}