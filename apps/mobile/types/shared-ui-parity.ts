/**
 * Type-level parity check for the shared UI native renderers.
 *
 * This file is typechecked by the mobile app, so the native implementations are
 * validated against the real React Native and react-native-svg types. It has no
 * runtime importers; it exists only so `tsc --noEmit` covers the native files.
 */
import type { ComponentType } from 'react';

import { Button } from '@master-sheet/ui/button/native';
import type { ButtonProps } from '@master-sheet/ui/button';
import { DotTracker } from '@master-sheet/ui/dot-tracker/native';
import type { DotTrackerProps } from '@master-sheet/ui/dot-tracker';
import { GemLogo } from '@master-sheet/ui/gem-logo/native';
import type { GemLogoProps } from '@master-sheet/ui/gem-logo';
import { Tag } from '@master-sheet/ui/tag/native';
import type { TagProps } from '@master-sheet/ui/tag';

export const nativeButton: ComponentType<ButtonProps> = Button;
export const nativeTag: ComponentType<TagProps> = Tag;
export const nativeGemLogo: ComponentType<GemLogoProps> = GemLogo;
export const nativeDotTracker: ComponentType<DotTrackerProps> = DotTracker;
