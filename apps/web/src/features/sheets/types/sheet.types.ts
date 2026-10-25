import type { UseFormReturn } from 'react-hook-form';

export type SheetFormValues = Record<string, unknown>;

export type SheetForm = UseFormReturn<SheetFormValues>;