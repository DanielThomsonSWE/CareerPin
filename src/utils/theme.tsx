import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

export const LIGHT_COLORS = {
  background: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#E9EFEB',
  border: '#E1E9E3',
  divider: '#EDF1EE',
  text: '#18352A',
  textSecondary: '#53665B',
  textMuted: '#809188',
  accent: '#2D6A4F',
  accentSoft: '#E6F2EA',
  dangerSoft: '#FCEDE8',
};

export const DARK_COLORS = {
  background: '#101815',
  surface: '#18241F',
  surfaceMuted: '#24332C',
  border: '#30443A',
  divider: '#2A3A32',
  text: '#F1F7F3',
  textSecondary: '#C1D0C7',
  textMuted: '#91A69A',
  accent: '#72C49A',
  accentSoft: '#234A36',
  dangerSoft: '#4B2B27',
};

export type ThemeColors = typeof LIGHT_COLORS;

type ThemeContextValue = {
  colors: ThemeColors;
  mode: 'light' | 'dark';
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);
  const mode = override ?? (systemScheme === 'light' ? 'light' : 'dark');
  const value = useMemo(() => ({
    colors: mode === 'light' ? LIGHT_COLORS : DARK_COLORS,
    mode,
    toggle: () => setOverride((current) => (current ?? mode) === 'dark' ? 'light' : 'dark'),
  }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useAppTheme must be used inside ThemeProvider');
  return theme;
}

