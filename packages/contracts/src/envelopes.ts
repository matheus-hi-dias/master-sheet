import { z } from 'zod';
import { sheetDataSchema, tagSchema } from './sheet';
import { templateStructureSchema } from './template';

export const authorSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
});

export type AuthorSummary = z.infer<typeof authorSummarySchema>;

export const templateTagSchema = tagSchema;

export const templateSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  structure: templateStructureSchema,
  system: z.string(),
  version: z.number().int(),
  isPublic: z.boolean(),
  isOfficial: z.boolean(),
  forkedFromId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorId: z.string().uuid(),
  author: authorSummarySchema.nullable(),
  tags: z.array(templateTagSchema),
});

export type TemplateSummary = z.infer<typeof templateSummarySchema>;

export const upsertTemplatePayloadSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  structure: templateStructureSchema,
  system: z.string().max(64).optional(),
  version: z.number().int().min(1).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(32)).max(20).optional(),
});

export type UpsertTemplatePayload = z.infer<typeof upsertTemplatePayloadSchema>;

export const paginatedMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginatedMeta = z.infer<typeof paginatedMetaSchema>;

export const paginatedResultSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: paginatedMetaSchema,
  });

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export const updateSheetPayloadSchema = z.object({
  data: sheetDataSchema,
  tags: z.array(z.string().max(32)).max(20).optional(),
});

export type UpdateSheetPayload = z.infer<typeof updateSheetPayloadSchema>;

export const authUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
});

export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;

export const authSessionResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  user: authUserResponseSchema,
});

export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;

export const messageResponseSchema = z.object({
  message: z.string(),
  status: z.string().optional(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const apiErrorEnvelopeSchema = z.object({
  statusCode: z.number().int().optional(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
  issues: z
    .array(
      z.object({
        code: z.string(),
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
      }),
    )
    .optional(),
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
