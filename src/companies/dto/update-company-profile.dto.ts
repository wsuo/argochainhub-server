import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  profile?: {
    description?: string;
    address?: string;
    phone?: string;
    website?: string;
    certificates?: string[];
  };
}