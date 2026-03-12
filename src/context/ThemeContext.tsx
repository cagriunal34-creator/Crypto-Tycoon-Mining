import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, ThemeConfig } from './themes';

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (id: string) => void;
  allThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'ct_theme_v1';

function applyTheme(t: ThemeConfig) {
  const root = document.documentElement;
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme', t.id);
  // Also update body background directly for immediate effect
  document.body.style.backgroundColor = t.vars['--ct-bg'];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'obsidian'; }
    catch { return 'emerald'; }
  });

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => { applyTheme(theme); }, [theme]);

  const setTheme = (id: string) => {
    setThemeId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, allThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
