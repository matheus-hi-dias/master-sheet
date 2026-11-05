import { Injectable, type PipeTransform } from '@nestjs/common';
import type { CreateTemplateDto } from '../dto/create-template.dto';
import type { UpdateTemplateDto } from '../dto/update-template.dto';
import { assertTemplateStructure } from '../validation/template-validation';

@Injectable()
export class TemplateStructureValidationPipe implements PipeTransform {
  transform(value: CreateTemplateDto | UpdateTemplateDto) {
    if (value.structure !== undefined) {
      value.structure = assertTemplateStructure(value.structure);
    }

    return value;
  }
}
