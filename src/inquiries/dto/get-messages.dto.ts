import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetMessagesDto extends PaginationDto {
  @ApiPropertyOptional({ description: '是否按时间倒序排列', default: true })
  @IsOptional()
  desc?: boolean = true;
}