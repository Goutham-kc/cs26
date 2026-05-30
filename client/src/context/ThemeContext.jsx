import { createContext, useContext, useState, useEffect } from 'react';

export const themes = {
  light: {
    '--color-bg':             '#FFFFFF',
    '--color-surface':        '#F2F2F2',
    '--color-surface-hover':  '#E8E8E8',
    '--color-surface-alt':    '#F9FAFB',
    '--color-border':         '#E5E7EB',
    '--color-border-strong':  '#D1D5DB',
    '--color-text-primary':   '#111111',
    '--color-text-secondary': '#6B7280',
    '--color-text-muted':     '#9CA3AF',
    '--color-inv-bg':         '#111111',
    '--color-inv-text':       '#FFFFFF',
    '--color-teal':           '#0D9488',
    '--color-teal-dark':      '#0F766E',
    '--color-teal-light':     '#CCFBF1',
    '--color-teal-bg':        '#D1FAE5',
    '--color-navy-dark':      '#1E3A5F',
    '--color-navy-light':     '#DBEAFE',
    '--color-navy-bg':        '#DBEAFE',
    '--color-red':            '#DC2626',
    '--color-red-dark':       '#B91C1C',
    '--color-red-light':      '#FEE2E2',
    '--color-red-bg':         '#FEE2E2',
    '--color-amber':          '#D97706',
    '--color-amber-bg':       '#FEF3C7',
    '--color-green':          '#059669',
    '--color-green-bg':       '#D1FAE5',
    '--color-code-bg':        '#1A1A1A',
    '--color-code-text':      '#AAFFAA',
  },
  dark: {
    '--color-bg':             '#313338',
    '--color-surface':        '#2b2d31',
    '--color-surface-hover':  '#35373c',
    '--color-surface-alt':    '#1e1f22',
    '--color-border':         '#3c3f46',
    '--color-border-strong':  '#4a4d55',
    '--color-text-primary':   '#f2f3f5',
    '--color-text-secondary': '#b5bac1',
    '--color-text-muted':     '#949ba4',
    '--color-inv-bg':         '#5865f2',
    '--color-inv-text':       '#ffffff',
    '--color-teal':           '#23a55a',
    '--color-teal-dark':      '#23a55a',
    '--color-teal-light':     '#1a3f2b',
    '--color-teal-bg':        '#1a3f2b',
    '--color-navy-dark':      '#5865f2',
    '--color-navy-light':     '#2e303d',
    '--color-navy-bg':        '#2e303d',
    '--color-red':            '#f23f43',
    '--color-red-dark':       '#f23f43',
    '--color-red-light':      '#3f1f22',
    '--color-red-bg':         '#3f1f22',
    '--color-amber':          '#f0b232',
    '--color-amber-bg':       '#3e301e',
    '--color-green':          '#23a55a',
    '--color-green-bg':       '#1a3f2b',
    '--color-code-bg':        '#1e1f22',
    '--color-code-text':      '#AAFFAA',
    '--color-invert-bg':      '#5865f2',
    '--color-invert-text':    '#ffffff',
    '--color-primary':        '#f2f3f5',
    '--color-secondary':      '#b5bac1',
    '--color-muted':          '#949ba4',
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