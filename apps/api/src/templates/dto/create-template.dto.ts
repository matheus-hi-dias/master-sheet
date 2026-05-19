import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'D&D 5e Character Sheet' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard D&D 5e sheet layout' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'JSON structure of the template' })
  @IsObject()
  structure: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'List of tags to associate with the template',
    example: ['d&d', 'fantasy'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
