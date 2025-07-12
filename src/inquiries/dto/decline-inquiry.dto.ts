import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeclineInquiryDto {
  @ApiProperty({ example: '价格不符合预期', description: '拒绝原因' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
