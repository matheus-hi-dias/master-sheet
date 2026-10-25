import type { TemplateStructure } from './template-structure';

export interface AuthorSummary {
  id: string;
  name: string | null;
}

export interface TemplateTag {
  id: string;
  name: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  structure: TemplateStructure;
  system: string;
  version: number;
  isPublic: boolean;
  isOfficial: boolean;
  forkedFromId: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: AuthorSummary | null;
  tags: TemplateTag[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}