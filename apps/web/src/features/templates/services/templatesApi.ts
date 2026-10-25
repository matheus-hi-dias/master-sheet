import { fetchApi } from '../../../lib/api';
import type { PaginatedResult, TemplateSummary } from '../types/templates';
import type { TemplateStructure } from '../types/template-structure';

export interface ListTemplatesParams {
  tags?: string[];
  isPublic?: boolean;
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
  return fetchApi(qs ? `/templates?${qs}` : '/templates');
}

export async function fetchTemplateDetail(id: string): Promise<TemplateSummary> {
  return fetchApi(`/templates/${id}`);
}

export async function forkTemplate(id: string): Promise<TemplateSummary> {
  return fetchApi(`/templates/${id}/fork`, { method: 'POST' });
}

export async function deleteTemplate(id: string): Promise<void> {
  return fetchApi(`/templates/${id}`, { method: 'DELETE' });
}

export interface UpsertTemplatePayload {
  name: string;
  description?: string;
  structure: TemplateStructure;
  system?: string;
  isPublic?: boolean;
  tags?: string[];
}

export async function createTemplate(
  payload: UpsertTemplatePayload,
): Promise<TemplateSummary> {
  return fetchApi('/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTemplate(
  id: string,
  payload: Partial<UpsertTemplatePayload>,
): Promise<TemplateSummary> {
  return fetchApi(`/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}