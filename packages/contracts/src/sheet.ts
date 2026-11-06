import { z } from 'zod';

export const tagSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string().min(1).max(32),
});

export type Tag = z.infer<typeof tagSchema>;

export const tagNameSchema = z.string().min(1).max(32);

export const sheetDataSchema = z.record(z.string(), z.unknown());

export type SheetData = z.infer<typeof sheetDataSchema>;

export const sheetSummarySchema = z.object({
  id: z.string().uuid(),
  character: z.string(),
  data: sheetDataSchema,
  userId: z.string().uuid(),
  templateId: z.string().uuid(),
  tags: z.array(tagSchema).optional(),
});

export type SheetSummary = z.infer<typeof sheetSummarySchema>;
