import { api } from './api';
import type {
  PaginatedResult,
  TemplateSummary,
} from '../types/template';

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
  const response = await api.get(qs ? `/templates?${qs}` : '/templates');
  return response.data;
}

export async function fetchTemplateDetail(
  id: string,
): Promise<TemplateSummary> {
  const response = await api.get(`/templates/${id}`);
  return response.data;
}

export interface UpsertTemplatePayload {
  name: string;
  description?: string;
  system?: string;
  isPublic?: boolean;
  tags?: string[];
  structure: TemplateSummary['structure'];
}

export async function createTemplate(
  payload: UpsertTemplatePayload,
): Promise<TemplateSummary> {
  const response = await api.post('/templates', payload);
  return response.data;
}

export async function updateTemplate(
  id: string,
  payload: Partial<UpsertTemplatePayload>,
): Promise<TemplateSummary> {
  const response = await api.patch(`/templates/${id}`, payload);
  return response.data;
}

export function totalFields(template: TemplateSummary): number {
  return template.structure.tabs.reduce(
    (sum, tab) =>
      sum +
      tab.sections.reduce(
        (acc, section) => acc + section.fields.length,
        0,
      ),
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