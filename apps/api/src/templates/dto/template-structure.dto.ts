import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_SYSTEMS,
  SUPPORTED_FIELD_TYPES,
} from '../types/template-structure.types';
import type { FieldType } from '../types/template-structure.types';

const FIELD_ALLOWED_KEYS: Record<FieldType, string[]> = {
  number: ['id', 'label', 'type', 'min', 'max', 'step', 'defaultValue'],
  text: ['id', 'label', 'type', 'placeholder', 'maxLength'],
  textarea: ['id', 'label', 'type', 'placeholder', 'maxLength'],
  dots: ['id', 'label', 'type', 'maxDots', 'defaultValue'],
  select: ['id', 'label', 'type', 'options'],
  checkbox: ['id', 'label', 'type', 'defaultValue'],
  formula: ['id', 'label', 'type', 'expression', 'dependencies'],
  repeater: ['id', 'label', 'type', 'itemSchema'],
};

@ValidatorConstraint({ name: 'fieldTypeCompatible', async: false })
class FieldTypeCompatibleConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    // The constraint is registered on the `type` property, so the value
    // passed in is just the type string. The whole field instance is the
    // object under validation; it carries every declared optional key as
    // `undefined` (useDefineForClassFields), so only defined keys count.
    const f = args.object as Record<string, unknown>;
    const type = f.type as FieldType;
    const allowedKeys = FIELD_ALLOWED_KEYS[type];

    if (!allowedKeys) {
      return false;
    }

    // No property outside the type's allowed set may be present.
    const presentKeys = Object.keys(f).filter((key) => f[key] !== undefined);
    if (presentKeys.some((key) => !allowedKeys.includes(key))) {
      return false;
    }

    switch (type) {
      case 'number':
        if (
          f.defaultValue !== undefined &&
          typeof f.defaultValue !== 'number'
        ) {
          return false;
        }
        return !['min', 'max', 'step'].some(
          (key) => f[key] !== undefined && typeof f[key] !== 'number',
        );

      case 'text':
      case 'textarea':
        if (f.placeholder !== undefined && typeof f.placeholder !== 'string') {
          return false;
        }
        return !(
          f.maxLength !== undefined &&
          (typeof f.maxLength !== 'number' || !Number.isInteger(f.maxLength))
        );

      case 'dots':
        if (f.maxDots === undefined || typeof f.maxDots !== 'number') {
          return false;
        }
        return !(
          f.defaultValue !== undefined && typeof f.defaultValue !== 'number'
        );

      case 'select':
        return (
          Array.isArray(f.options) &&
          f.options.every(
            (option) =>
              typeof option === 'object' &&
              option !== null &&
              typeof (option as { label?: unknown }).label === 'string' &&
              typeof (option as { value?: unknown }).value === 'string' &&
              Object.keys(option as object).every((key) =>
                ['label', 'value'].includes(key),
              ),
          )
        );

      case 'checkbox':
        return !(
          f.defaultValue !== undefined && typeof f.defaultValue !== 'boolean'
        );

      case 'formula':
        return (
          typeof f.expression === 'string' &&
          Array.isArray(f.dependencies) &&
          f.dependencies.every((dep) => typeof dep === 'string')
        );

      case 'repeater':
        return Array.isArray(f.itemSchema);

      default:
        return false;
    }
  }

  defaultMessage(): string {
    return 'Field definition is not compatible with its declared type';
  }
}

export function FieldTypeCompatible(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: FieldTypeCompatibleConstraint,
    });
  };
}

export class SelectOptionDto {
  @ApiProperty({ example: 'Strength' })
  @IsString()
  label!: string;

  @ApiProperty({ example: 'str' })
  @IsString()
  value!: string;
}

export class FieldDefinitionDto {
  @ApiProperty({ example: 'str_score' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Strength' })
  @IsString()
  label!: string;

  @ApiProperty({ enum: SUPPORTED_FIELD_TYPES, example: 'number' })
  @IsIn(SUPPORTED_FIELD_TYPES)
  @FieldTypeCompatible()
  type!: FieldType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  min?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  max?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  step?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  defaultValue?: unknown;

  @ApiPropertyOptional({ example: 'Enter a value…' })
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  maxLength?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  maxDots?: number;

  @ApiPropertyOptional({ type: [SelectOptionDto] })
  @IsOptional()
  @Type(() => SelectOptionDto)
  @ValidateNested({ each: true })
  options?: SelectOptionDto[];

  @ApiPropertyOptional({ example: 'floor((str - 10) / 2)' })
  @IsOptional()
  expression?: string;

  @ApiPropertyOptional({ example: ['str'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @ApiPropertyOptional({ type: [FieldDefinitionDto] })
  @IsOptional()
  @Type(() => FieldDefinitionDto)
  @ValidateNested({ each: true })
  itemSchema?: FieldDefinitionDto[];
}

export class SectionDefinitionDto {
  @ApiProperty({ example: 'abilities' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Abilities' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  columns?: number;

  @ApiProperty({ type: [FieldDefinitionDto] })
  @IsArray()
  @Type(() => FieldDefinitionDto)
  @ValidateNested({ each: true })
  fields!: FieldDefinitionDto[];
}

export class TabDefinitionDto {
  @ApiProperty({ example: 'main' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Main' })
  @IsString()
  label!: string;

  @ApiPropertyOptional({ example: 'swords' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ type: [SectionDefinitionDto] })
  @IsArray()
  @Type(() => SectionDefinitionDto)
  @ValidateNested({ each: true })
  sections!: SectionDefinitionDto[];
}

export class TemplateStructureDto {
  @ApiProperty({
    example: 'dnd5e',
    enum: DEFAULT_SYSTEMS,
    description:
      'System identifier (dnd5e, vampire_v5, tormenta20, coc7e, custom)',
  })
  @IsString()
  @MaxLength(64)
  system!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  version!: number;

  @ApiProperty({ type: [TabDefinitionDto] })
  @IsArray()
  @Type(() => TabDefinitionDto)
  @ValidateNested({ each: true })
  tabs!: TabDefinitionDto[];
}
