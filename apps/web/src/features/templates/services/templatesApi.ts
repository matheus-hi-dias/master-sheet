import { fetchApi } from '../../../lib/api';
import type { PaginatedResult, TemplateSummary } from '../types/templates';
import type { TemplateStructure } from '@master-sheet/contracts';

export interface ListTemplatesParams {
  tags?: string[];
  isPublic?: boolean;
  search?: string;
  system?: string;
  scope?: 'public' | 'mine';
  page?: number;
  limit?: number;
}

export function fetchTemplates(
  params: ListTemplatesParams = {},
): Promise<PaginatedResult<TemplateSummary>> {
  const query = new URLSearchParams();

  if (params.tags && params.tags.length > 0) {
    query.append('tags', params.tags.join(','));
  }
  if (params.isPublic !== undefined) {
    query.append('isPublic', String(params.isPublic));
  }
  if (params.search) {
    query.append('search', params.search);
  }
  if (params.system) {
    query.append('system', params.system);
  }
  if (params.scope) {
    query.append('scope', params.scope);
  }
  query.append('page', String(params.page ?? 1));
  query.append('limit', String(params.limit ?? 12));

  const qs = query.toString();
  return fetchApi<PaginatedResult<TemplateSummary>>(
    qs ? `/templates?${qs}` : '/templates',
  );
}

export function fetchTemplateDetail(id: string): Promise<TemplateSummary> {
  return fetchApi<TemplateSummary>(`/templates/${id}`);
}

export function forkTemplate(id: string): Promise<TemplateSummary> {
  return fetchApi<TemplateSummary>(`/templates/${id}/fork`, { method: 'POST' });
}

export function deleteTemplate(id: string): Promise<void> {
  return fetchApi<void>(`/templates/${id}`, { method: 'DELETE' });
}

export interface UpsertTemplatePayload {
  name: string;
  description?: string;
  structure: TemplateStructure;
  system?: string;
  isPublic?: boolean;
  tags?: string[];
}

export function createTemplate(
  payload: UpsertTemplatePayload,
): Promise<TemplateSummary> {
  return fetchApi<TemplateSummary>('/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTemplate(
  id: string,
  payload: Partial<UpsertTemplatePayload>,
): Promise<TemplateSummary> {
  return fetchApi<TemplateSummary>(`/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
