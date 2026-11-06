import { getJson, patchJson, postJson } from './api';
import type {
  PaginatedResult,
  TemplateSummary,
  UpsertTemplatePayload,
} from '@master-sheet/contracts';

export interface ListTemplatesParams {
  search?: string;
  system?: string;
  scope?: 'public' | 'mine';
  page?: number;
  limit?: number;
}

export async function fetchTemplates(
  params: ListTemplatesParams = {},
): Promise<PaginatedResult<TemplateSummary>> {
  const query = new URLSearchParams();

  if (params.search) query.append('search', params.search);
  if (params.system) query.append('system', params.system);
  query.append('scope', params.scope ?? 'public');
  query.append('page', String(params.page ?? 1));
  query.append('limit', String(params.limit ?? 12));

  const qs = query.toString();
  return getJson<PaginatedResult<TemplateSummary>>(
    qs ? `/templates?${qs}` : '/templates',
  );
}

export function fetchTemplateDetail(id: string): Promise<TemplateSummary> {
  return getJson<TemplateSummary>(`/templates/${id}`);
}

export function createTemplate(
  payload: UpsertTemplatePayload,
): Promise<TemplateSummary> {
  return postJson<TemplateSummary>('/templates', payload);
}

export function updateTemplate(
  id: string,
  payload: Partial<UpsertTemplatePayload>,
): Promise<TemplateSummary> {
  return patchJson<TemplateSummary>(`/templates/${id}`, payload);
}

export function totalFields(template: TemplateSummary): number {
  return template.structure.tabs.reduce(
    (sum, tab) =>
      sum +
      tab.sections.reduce((acc, section) => acc + section.fields.length, 0),
    0,
  );
}

export function collectTabFieldLabels(
  template: TemplateSummary,
  limitPerTab = 4,
): string[] {
  const labels: string[] = [];
  for (const tab of template.structure.tabs) {
    for (const section of tab.sections) {
      for (const field of section.fields) {
        if (labels.length >= limitPerTab) return labels;
        if (field.type === 'formula') continue;
        labels.push(field.label);
      }
    }
  }
  return labels;
}
