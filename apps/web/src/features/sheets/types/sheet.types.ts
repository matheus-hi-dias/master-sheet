import type { UseFormReturn } from 'react-hook-form';
import type { SheetData } from '@master-sheet/contracts';

export type SheetFormValues = SheetData;

export type SheetForm = UseFormReturn<SheetFormValues>;
