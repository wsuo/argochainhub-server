import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InquiryStatus } from '../../entities/inquiry.entity';

export class SearchInquiriesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InquiryStatus, description: '询价状态' })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;
}