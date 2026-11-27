/**
 * Compile-time parity check: both platform renderers must satisfy the shared
 * prop contract exported from `types.ts`.
 */
import type { ComponentType } from 'react';

import { Button as ButtonWeb } from '../src/button/button.web';
import { Button as ButtonNative } from '../src/button/button.native';
import type { ButtonProps } from '../src/button/types';
import { DotTracker as DotTrackerWeb } from '../src/dot-tracker/dot-tracker.web';
import { DotTracker as DotTrackerNative } from '../src/dot-tracker/dot-tracker.native';
import type { DotTrackerProps } from '../src/dot-tracker/types';
import { GemLogo as GemLogoWeb } from '../src/gem-logo/gem-logo.web';
import { GemLogo as GemLogoNative } from '../src/gem-logo/gem-logo.native';
import type { GemLogoProps } from '../src/gem-logo/types';
import { Tag as TagWeb } from '../src/tag/tag.web';
import { Tag as TagNative } from '../src/tag/tag.native';
import type { TagProps } from '../src/tag/types';

export const webButton: ComponentType<ButtonProps> = ButtonWeb;
export const nativeButton: ComponentType<ButtonProps> = ButtonNative;

export const webTag: ComponentType<TagProps> = TagWeb;
export const nativeTag: ComponentType<TagProps> = TagNative;

export const webGemLogo: ComponentType<GemLogoProps> = GemLogoWeb;
export const nativeGemLogo: ComponentType<GemLogoProps> = GemLogoNative;

export const webDotTracker: ComponentType<DotTrackerProps> = DotTrackerWeb;
export const nativeDotTracker: ComponentType<DotTrackerProps> =
  DotTrackerNative;
