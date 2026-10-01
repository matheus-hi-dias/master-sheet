import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateStructureDto } from './template-structure.dto';

export class CreateTemplateDto {
  @ApiProperty({ example: 'D&D 5e Character Sheet' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard D&D 5e sheet layout' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Structured DSL describing tabs, sections and fields',
    type: TemplateStructureDto,
  })
  @ValidateNested()
  @Type(() => TemplateStructureDto)
  structure: TemplateStructureDto;

  @ApiPropertyOptional({ example: 'dnd5e', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  system?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;

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
