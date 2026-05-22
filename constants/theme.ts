import { Platform } from 'react-native';

// 🎨 CareerPath AI — Premium Color System
// Primary: Violet-indigo gradient brand
// Accent: Electric cyan for highlights

export const Palette = {
  // Brand
  violet: '#7C3AED',
  violetLight: '#8B5CF6',
  violetDark: '#5B21B6',
  indigo: '#4F46E5',
  cyan: '#06B6D4',
  cyanLight: '#22D3EE',

  // Neutrals — Dark
  dark900: '#0A0A0F',
  dark800: '#111118',
  dark700: '#1A1A27',
  dark600: '#22223B',
  dark500: '#2D2D4E',
  dark400: '#3D3D6B',

  // Neutrals — Light
  light100: '#F8F7FF',
  light200: '#EDEDFA',
  light300: '#DDDDF5',
  light400: '#BBBBD9',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#F8F7FF',
    backgroundSecondary: '#EDEDFA',
    tint: Palette.violet,
    icon: '#6B6B9A',
    tabIconDefault: '#6B6B9A',
    tabIconSelected: Palette.violet,
    primary: Palette.violet,
    primaryLight: Palette.violetLight,
    accent: Palette.cyan,
    gray: '#6B6B9A',
    grayLight: '#9898BB',
    border: '#DDDDF5',
    cardBackground: '#FFFFFF',
    cardBorder: '#EDEDFA',
    shadow: 'rgba(124, 58, 237, 0.08)',
    gradientStart: Palette.violet,
    gradientEnd: Palette.cyan,
    success: Palette.success,
    error: Palette.error,
  },
  dark: {
    text: '#EEEEFF',
    background: '#0A0A0F',
    backgroundSecondary: '#111118',
    tint: Palette.violetLight,
    icon: '#8888BB',
    tabIconDefault: '#8888BB',
    tabIconSelected: Palette.violetLight,
    primary: Palette.violetLight,
    primaryLight: '#A78BFA',
    accent: Palette.cyanLight,
    gray: '#8888BB',
    grayLight: '#6B6B9A',
    border: '#2D2D4E',
    cardBackground: '#1A1A27',
    cardBorder: '#22223B',
    shadow: 'rgba(124, 58, 237, 0.25)',
    gradientStart: Palette.violetLight,
    gradientEnd: Palette.cyanLight,
    success: '#34D399',
    error: '#F87171',
  },
};

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
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', Meiryo, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
