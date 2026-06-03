import { createContext, useContext, useState, useEffect } from 'react';

export const themes = {
  light: {
    '--color-bg':             '#FFFFFF',
    '--color-surface':        '#F2F2F2',
    '--color-surface-hover':  '#E8E8E8',
    '--color-border':         '#CCCCCC',
    '--color-border-strong':  '#999999',
    '--color-text-primary':   '#111111',
    '--color-text-secondary': '#444444',
    '--color-text-muted':     '#888888',
    '--color-invert-bg':      '#000000',
    '--color-invert-bg-hover':'#222222',
    '--color-invert-text':    '#FFFFFF',
    '--color-topbar-border':  '#222222',
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
    '--color-inv-bg':         '#000000',
    '--color-inv-text':       '#FFFFFF',
  },
  dark: {
    '--color-bg':             '#0B0F19',
    '--color-surface':        '#151B2C',
    '--color-surface-hover':  '#1F273D',
    '--color-border':         '#222B45',
    '--color-border-strong':  '#4A5568',
    '--color-text-primary':   '#E4E7EB',
    '--color-text-secondary': '#A3B1C5',
    '--color-text-muted':     '#6B7A90',
    '--color-invert-bg':      '#1E293B',
    '--color-invert-bg-hover':'#334155',
    '--color-invert-text':    '#FFFFFF',
    '--color-topbar-border':  '#1A2238',
    '--color-teal':           '#14B8A6',
    '--color-teal-dark':      '#0F766E',
    '--color-teal-light':     '#132E32',
    '--color-navy-dark':      '#3B82F6',
    '--color-navy-light':     '#172554',
    '--color-red':            '#EF4444',
    '--color-red-dark':       '#991B1B',
    '--color-red-light':      '#450A0A',
    // Legacies
    '--color-primary':        '#E4E7EB',
    '--color-secondary':      '#A3B1C5',
    '--color-muted':          '#6B7A90',
    '--color-inv-bg':         '#1E293B',
    '--color-inv-text':       '#FFFFFF',
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