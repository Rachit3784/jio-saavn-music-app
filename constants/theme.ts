import { Platform } from 'react-native';

const tintColorLight = '#FF8216'; // Orange accent from Figma
const tintColorDark = '#FF8216';

export const Colors = {
  light: {
    text: '#11181C',
    secondaryText: '#687076',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    accent: '#FF8216',
    card: '#F5F5F5',
  },
  dark: {
    text: '#ECEDEE',
    secondaryText: '#9BA1A6',
    background: '#151718', // Deep dark
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    accent: '#FF8216',
    card: '#1E1E1E',
  },
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
});