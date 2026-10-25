import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { MAX_REPEATER_DEPTH } from '../utils/template-structure.util';

/**
 * Runs before the validation pipe so malformed `structure` payloads cannot
 * recurse deeply enough to exhaust the stack during class-transformer nesting.
 */
@Injectable()
export class TemplatePayloadGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as { structure?: unknown } | undefined;

    if (body?.structure !== undefined) {
      assertStructureDepth(body.structure);
    }

    return true;
  }
}

export function assertStructureDepth(structure: unknown): void {
  if (!structure || typeof structure !== 'object') {
    return;
  }

  const tabs = (structure as { tabs?: unknown }).tabs;
  if (!Array.isArray(tabs)) {
    return;
  }

  const stack: Array<{ field: unknown; depth: number }> = [];

  for (const tab of tabs) {
    if (!tab || typeof tab !== 'object') continue;

    const sections = (tab as { sections?: unknown }).sections;
    if (!Array.isArray(sections)) continue;

    for (const section of sections) {
      if (!section || typeof section !== 'object') continue;

      const fields = (section as { fields?: unknown }).fields;
      if (!Array.isArray(fields)) continue;

      for (const field of fields) {
        stack.push({ field, depth: 0 });
      }
    }
  }

  while (stack.length > 0) {
    const { field, depth } = stack.pop()!;

    if (depth > MAX_REPEATER_DEPTH) {
      throw new BadRequestException(
        `Template DSL is nested too deeply (max ${MAX_REPEATER_DEPTH} repeater levels)`,
      );
    }

    if (!field || typeof field !== 'object') continue;

    const itemSchema = (field as { itemSchema?: unknown }).itemSchema;
    if (!Array.isArray(itemSchema)) continue;

    for (const child of itemSchema) {
      stack.push({ field: child, depth: depth + 1 });
    }
  }
}
