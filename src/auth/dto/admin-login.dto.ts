import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'superadmin', description: '管理员用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'Admin123!', description: '管理员密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}