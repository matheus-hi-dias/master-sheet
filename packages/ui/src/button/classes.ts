import type { ButtonVariant } from './types';

/**
 * Token-backed color/border decisions shared by both platform renderers.
 * Layout classes stay per-platform.
 */
export const buttonVariantClasses: Record<ButtonVariant, string> = {
  gold: 'bg-gold border-gold text-on-gold',
  outline: 'bg-transparent border-gold text-gold',
  ghost: 'bg-bg-card border-border text-text-muted',
  danger: 'bg-transparent border-danger text-danger',
};

export const buttonWebVariantClasses: Record<ButtonVariant, string> = {
  gold: `${buttonVariantClasses.gold} hover:not-disabled:brightness-110 hover:not-disabled:shadow-gold-glow`,
  outline: `${buttonVariantClasses.outline} hover:not-disabled:bg-gold-tint`,
  ghost: `${buttonVariantClasses.ghost} hover:not-disabled:text-text-main hover:not-disabled:border-text-muted`,
  danger: `${buttonVariantClasses.danger} hover:not-disabled:bg-danger-tint`,
};
