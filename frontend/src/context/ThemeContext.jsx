import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

const STORAGE_KEY = 'bluemoon-theme';
const VALID_THEMES = ['dark', 'light', 'abyss'];
const THEME_CYCLE = ['dark', 'light', 'abyss']; // cycle order

/**
 * Determine the initial theme:
 * 1. Check localStorage for a saved preference
 * 2. Fall back to OS-level prefers-color-scheme
 * 3. Default to 'dark' if neither is available
 */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID_THEMES.includes(saved)) return saved;
  } catch {
    // localStorage may be unavailable (e.g. private browsing in some browsers)
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Sync the data-theme attribute on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Toggle a 'dark' class for dark-mode themes (dark + abyss)
    if (theme === 'dark' || theme === 'abyss') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Silently ignore localStorage write failures
    }
  }, [theme]);

  // Listen for OS-level theme changes (only when no explicit user preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Only auto-switch if the user hasn't explicitly chosen a theme
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Cycle through themes: dark → light → abyss → dark
  const cycleTheme = () => {
    setTheme((prev) => {
      const idx = THEME_CYCLE.indexOf(prev);
      return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access theme state and controls.
 * Must be used within a <ThemeProvider>.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
