import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, MUSCLE_COLORS } from '../theme/colors';

const STORAGE_KEY = 'gymstats:theme_preference'; // 'dark' | 'light' | 'auto'

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState('dark');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light' || saved === 'auto') setPreferenceState(saved);
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme || 'dark'));
    return () => sub.remove();
  }, []);

  const setPreference = useCallback((pref) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const resolvedScheme = preference === 'auto' ? systemScheme : preference;
  const COLORS = resolvedScheme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  const value = useMemo(
    () => ({ preference, setPreference, resolvedScheme, COLORS, MUSCLE_COLORS }),
    [preference, resolvedScheme, COLORS, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
