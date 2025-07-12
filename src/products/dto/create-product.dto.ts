import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: '草甘膦原药' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '除草剂' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category: string;

  @ApiPropertyOptional({ example: '1071-83-6' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  casNo?: string;

  @ApiProperty({ example: '95%原药' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  formulation: string;

  @ApiProperty({ example: '草甘膦' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  activeIngredient: string;

  @ApiProperty({ example: '95%' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  content: string;

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