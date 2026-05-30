import { createContext, useContext, useState, useEffect } from 'react';

export const themes = {
  light: {
    '--color-bg':             '#FFFFFF',
    '--color-surface':        '#F2F2F2',
    '--color-surface-hover':  '#E8E8E8',
    '--color-border':         '#CCCCCC',
    '--color-text-primary':   '#111111',
    '--color-text-secondary': '#444444',
    '--color-text-muted':     '#888888',
    '--color-invert-bg':      '#000000',
    '--color-invert-text':    '#FFFFFF',
    '--color-teal':           '#0D9488',
    '--color-teal-dark':      '#0F766E',
    '--color-teal-light':     '#CCFBF1',
    '--color-navy-dark':      '#1E3A5F',
    '--color-navy-light':     '#DBEAFE',
    '--color-red':            '#DC2626',
    '--color-red-dark':       '#991b1b',
    '--color-red-light':      '#fee2e2',
    // Legacies
    '--color-primary':        '#111111',
    '--color-secondary':      '#444444',
    '--color-muted':          '#888888',
    '--color-inv-bg':         '#111111',
    '--color-inv-text':       '#FFFFFF',
  },
  dark: {
    '--color-bg':             '#0F1117',
    '--color-surface':        '#1A1D27',
    '--color-surface-hover':  '#252936',
    '--color-border':         '#2A2D3A',
    '--color-text-primary':   '#F0F0F0',
    '--color-text-secondary': '#A0A0A0',
    '--color-text-muted':     '#666666',
    '--color-invert-bg':      '#F0F0F0',
    '--color-invert-text':    '#111111',
    '--color-teal':           '#14B8A6',
    '--color-teal-dark':      '#2DD4BF',
    '--color-teal-light':     '#115E59',
    '--color-navy-dark':      '#93C5FD',
    '--color-navy-light':     '#1E3A8A',
    '--color-red':            '#F87171',
    '--color-red-dark':       '#fca5a5',
    '--color-red-light':      '#7f1d1d',
    // Legacies
    '--color-primary':        '#F0F0F0',
    '--color-secondary':      '#A0A0A0',
    '--color-muted':          '#666666',
    '--color-inv-bg':         '#F0F0F0',
    '--color-inv-text':       '#111111',
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