import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: '消息内容', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}