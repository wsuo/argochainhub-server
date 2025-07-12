import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AttachmentType } from '../../entities/attachment.entity';

export class UploadFileDto {
  @ApiProperty({
    description: '文件',
    type: 'string',
    format: 'binary',
  })
  file: any;

  @ApiProperty({
    description: '文件类型',
    enum: AttachmentType,
    example: AttachmentType.PRODUCT_IMAGE,
  })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty({
    description: '关联ID(如产品ID、公司ID等)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  relatedId?: number;
}
