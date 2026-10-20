import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Surfaces
    background: '#F7F7F7',
    surface: '#FFFFFF',
    surfaceRaised: '#EFEFEF',
    surfacePressed: '#E5E5E5',
    border: '#E0E0E0',

    // The only accent
    primary: '#E67A12',
    primaryPressed: '#C96509',
    primaryMuted: 'rgba(230, 122, 18, 0.14)',
    onPrimary: '#0A0A0A',

    // Text
    text: '#171717',
    textMuted: '#737373',
    textFaint: '#A3A3A3',
    textSecondary: '#737373',
    textTertiary: '#A3A3A3',

    // Status
    danger: '#DC2626',

    // Data shades
    calories: '#E67A12',
    protein: '#171717',
    carbs: '#525252',
    fat: '#737373',
    fats: '#737373',
    fiber: '#A3A3A3',
    fibre: '#A3A3A3',
    ringTrack: '#EFEFEF',

    // UI conveniences & backwards-compatible aliases
    badgeYield: '#E67A12',
    accent: '#E67A12',
    accentMuted: 'rgba(230, 122, 18, 0.14)',
    backgroundElement: '#EFEFEF',
    backgroundSelected: '#E5E5E5',
    surfaceElevated: '#FFFFFF',
    cardShadow: 'transparent',
  },
  dark: {
    // Surfaces (Monochrome near-black canvas & graphite cards)
    background: '#0A0A0A',          // Root canvas (never pure black)
    surface: '#161616',             // Cards, tab bar
    surfaceRaised: '#222222',       // Inputs, chips, secondary buttons, ring tracks
    surfacePressed: '#2C2C2C',      // Pressed and selected states
    border: '#2E2E2E',              // Dividers and input outlines only (cards have no border)

    // The only accent
    primary: '#FF8A1F',             // Saffron: main button, active tab, calories
    primaryPressed: '#E67A12',
    primaryMuted: 'rgba(255, 138, 31, 0.16)',
    onPrimary: '#0A0A0A',           // Dark text on saffron, never white

    // Text
    text: '#F2F2F2',
    textMuted: '#9A9A9A',
    textFaint: '#858585',           // Units and captions (passes 4.5:1 on surface)
    textSecondary: '#9A9A9A',
    textTertiary: '#858585',

    // Status (the only other colour)
    danger: '#FF6B6B',              // Over target and errors only

    // Data shades (fixed; used only for rings, bars and macro marks)
    calories: '#FF8A1F',            // Saffron
    protein: '#FFFFFF',             // Brightest: lifter's priority metric
    carbs: '#BDBDBD',
    fat: '#959595',
    fats: '#959595',
    fiber: '#707070',
    fibre: '#707070',
    ringTrack: '#222222',

    // UI conveniences & backwards-compatible aliases
    badgeYield: '#FF8A1F',
    accent: '#FF8A1F',
    accentMuted: 'rgba(255, 138, 31, 0.16)',
    backgroundElement: '#222222',
    backgroundSelected: '#2C2C2C',
    surfaceElevated: '#222222',
    cardShadow: 'transparent',
  },
} as const;

export type ThemeColors = typeof Colors.dark;
export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 20,
  pill: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 75 }) ?? 60;
export const MaxContentWidth = 720;
