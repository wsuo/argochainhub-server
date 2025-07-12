import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, MaxLength } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: '草甘膦原药' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '除草剂' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  category?: string;

  @ApiPropertyOptional({ example: '1071-83-6' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  casNo?: string;

  @ApiPropertyOptional({ example: '95%原药' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  formulation?: string;

  @ApiPropertyOptional({ example: '草甘膦' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  activeIngredient?: string;

  @ApiPropertyOptional({ example: '95%' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  content?: string;

  @ApiPropertyOptional({ example: '高效除草剂，广谱杀草效果好' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  details?: {
    toxicity?: string;
    physicalProperties?: object;
    packagingSpecs?: string[];
    storageConditions?: string;
    shelfLife?: string;
  };
}