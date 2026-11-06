import { BadRequestException } from '@nestjs/common';
import type { TemplateStructure } from '@master-sheet/contracts';
import { validateTemplateStructure } from '@master-sheet/sheet-engine/validation';

export function assertTemplateStructure(input: unknown): TemplateStructure {
  const result = validateTemplateStructure(input);

  if (!result.ok) {
    throw new BadRequestException({
      message: result.issues.map((item) => item.message),
      issues: result.issues,
    });
  }

  return result.data;
}
