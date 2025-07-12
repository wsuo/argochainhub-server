import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { CompanyType } from '../../entities/company.entity';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ example: 'ABC Company Ltd.' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ enum: CompanyType, example: CompanyType.BUYER })
  @IsEnum(CompanyType)
  @IsNotEmpty()
  companyType: CompanyType;
}