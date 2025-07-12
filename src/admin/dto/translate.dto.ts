import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import {
  SupportedLanguage,
  getSupportedLanguages,
} from '../../common/utils/language-mapper';

export class TranslateRequestDto {
  @ApiProperty({
    description: '需要翻译的文本',
    example: '需要翻译的原文',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: '源语言代码，如果不提供则自动检测',
    example: 'zh-CN',
    enum: getSupportedLanguages(),
  })
  @IsOptional()
  @IsString()
  @IsIn(getSupportedLanguages())
  source_lang?: SupportedLanguage;

  @ApiProperty({
    description: '目标语言代码',
    example: 'en',
    enum: getSupportedLanguages(),
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(getSupportedLanguages())
  target_lang: SupportedLanguage;
}

export class TranslateResponseDto {
  @ApiProperty({
    description: '翻译结果',
    example: {
      translated_text: 'Translated text from the service.',
    },
  })
  data: {
    translated_text: string;
  };
}

export class LanguageDetectionDto {
  @ApiProperty({
    description: '需要检测语言的文本',
    example: 'Hello world',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class LanguageDetectionResponseDto {
  @ApiProperty({
    description: '语言检测结果',
    example: {
      detected_language: 'en',
      confidence: 0.99,
    },
  })
  data: {
    detected_language: SupportedLanguage;
    confidence: number;
  };
}
