import { createContext, useContext, useState, useEffect } from 'react';

export const themes = {
  light: {
    '--color-bg':      '#FFFFFF',
    '--color-surface': '#F2F2F2',
    '--color-border':  '#E5E5E5',
    '--color-primary': '#111111',
    '--color-secondary':'#444444',
    '--color-muted':   '#888888',
    '--color-inv-bg':  '#111111',
    '--color-inv-text':'#FFFFFF',
    '--color-teal':    '#0D9488',
    '--color-red':     '#DC2626',
  },
  dark: {
    '--color-bg':      '#0F1117',
    '--color-surface': '#1A1D27',
    '--color-border':  '#2A2D3A',
    '--color-primary': '#F0F0F0',
    '--color-secondary':'#A0A0A0',
    '--color-muted':   '#666666',
    '--color-inv-bg':  '#F0F0F0',
    '--color-inv-text':'#111111',
    '--color-teal':    '#14B8A6',
    '--color-red':     '#F87171',
  }
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('oaq_theme') || 'light');

  useEffect(() => {
    const vars = themes[theme];
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    localStorage.setItem('oaq_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);