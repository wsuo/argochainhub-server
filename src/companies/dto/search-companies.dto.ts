import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchCompaniesDto extends PaginationDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: '国家/地区代码', 
    example: 'CN',
    enum: ['CN', 'US', 'IN', 'BR', 'DE', 'FR', 'IT', 'ES', 'AU', 'AR']
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ 
    description: '企业规模', 
    example: 'medium',
    enum: ['small', 'medium', 'large']
  })
  @IsOptional()
  @IsEnum(['small', 'medium', 'large'])
  companySize?: 'small' | 'medium' | 'large';

  @ApiPropertyOptional({ 
    description: '排序字段', 
    example: 'createdAt',
    enum: ['createdAt', 'productCount', 'name']
  })
  @IsOptional()
  @IsIn(['createdAt', 'productCount', 'name'])
  sortBy?: 'createdAt' | 'productCount' | 'name';

  @ApiPropertyOptional({ 
    description: '排序方向', 
    example: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ 
    description: '是否只显示Top100供应商', 
    example: true,
    type: 'boolean'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isTop100?: boolean;
}
