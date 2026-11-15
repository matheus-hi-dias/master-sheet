/**
 * Single source of truth for Master-Sheet visual tokens.
 *
 * This file is data only. `scripts/generate.mjs` reads the compiled output and
 * emits the CSS custom properties, the web Tailwind `@theme` fragment, the
 * NativeWind preset, the typed constants and the font manifest.
 */

export interface ThemeValue {
  dark: string;
  light: string;
}

export const colorTokens = {
  bgApp: { dark: '#121212', light: '#faf9f6' },
  bgPanel: { dark: '#1a1a1b', light: '#f0efea' },
  bgCard: { dark: '#242424', light: '#ffffff' },
  textMain: { dark: '#e0e0e0', light: '#2d3436' },
  textMuted: { dark: '#888888', light: '#636e72' },
  gold: { dark: '#d4af37', light: '#b8860b' },
  goldDim: { dark: '#9a7d26', light: '#8b6914' },
  goldTint: {
    dark: 'rgba(212, 175, 55, 0.08)',
    light: 'rgba(184, 134, 11, 0.08)',
  },
  border: { dark: '#3d3d3d', light: '#dcd7c9' },
  danger: { dark: '#c0392b', light: '#c0392b' },
  dangerTint: {
    dark: 'rgba(192, 57, 43, 0.1)',
    light: 'rgba(192, 57, 43, 0.1)',
  },
  success: { dark: '#27ae60', light: '#27ae60' },
  warning: { dark: '#e67e22', light: '#e67e22' },
  link: { dark: '#2e78b7', light: '#2e78b7' },
  onGold: { dark: '#121212', light: '#121212' },
} satisfies Record<string, ThemeValue>;

export type ColorName = keyof typeof colorTokens;

export const radii = {
  card: '8px',
  pill: '9999px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
} as const;

export const typography = {
  display: {
    family: 'Cinzel',
    webStack: "'Cinzel', serif",
  },
  body: {
    family: 'Lato',
    webStack: "'Lato', sans-serif",
  },
} as const;

export const shadows = {
  card: {
    dark: '0 4px 24px rgba(0, 0, 0, 0.5)',
    light: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  goldGlow: {
    dark: '0 0 16px rgba(212, 175, 55, 0.35)',
    light: '0 0 16px rgba(212, 175, 55, 0.35)',
  },
  dotGlow: {
    dark: '0 0 8px rgba(212, 175, 55, 0.5)',
    light: '0 0 8px rgba(212, 175, 55, 0.5)',
  },
  tagGlow: {
    dark: '0 0 12px rgba(212, 175, 55, 0.3)',
    light: '0 0 12px rgba(212, 175, 55, 0.3)',
  },
} satisfies Record<string, ThemeValue>;

export type ShadowName = keyof typeof shadows;

export const motion = {
  duration: {
    fast: 150,
    base: 200,
    theme: 300,
    dice: 350,
    drawer: 300,
  },
  easing: {
    dice: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    drawer: 'cubic-bezier(0.28, 0.75, 0.25, 1)',
  },
} as const;

export const auraGradient =
  'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)';

export interface FontAsset {
  family: string;
  file: string;
  weight: string;
  style: 'normal' | 'italic';
}

export const fontAssets: readonly FontAsset[] = [
  {
    family: 'Cinzel',
    file: 'Cinzel-VariableFont_wght.ttf',
    weight: '400 700',
    style: 'normal',
  },
  {
    family: 'Lato',
    file: 'Lato-Regular.ttf',
    weight: '400',
    style: 'normal',
  },
  {
    family: 'SpaceMono',
    file: 'SpaceMono-Regular.ttf',
    weight: '400',
    style: 'normal',
  },
];
