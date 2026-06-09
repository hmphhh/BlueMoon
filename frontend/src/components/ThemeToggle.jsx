import { useTheme } from '../context/ThemeContext';

/**
 * Circular icon-only theme toggle button.
 * Cycles: Dark (Moon) → Light (Sun) → Abyss (Waves) → Dark ...
 * Shows the icon of the CURRENT theme.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, cycleTheme } = useTheme();

  const labels = {
    dark: 'Switch to Light mode',
    light: 'Switch to Abyss mode',
    abyss: 'Switch to Dark mode',
  };

  return (
    <button
      id="theme-toggle"
      className={`theme-toggle ${className}`}
      onClick={cycleTheme}
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      {/* Moon — shown when dark theme is active */}
      <span className={`theme-toggle__icon ${theme === 'dark' ? '' : 'theme-toggle__icon--hidden'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>

      {/* Sun — shown when light theme is active */}
      <span className={`theme-toggle__icon ${theme === 'light' ? '' : 'theme-toggle__icon--hidden'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>

      {/* Waves — shown when abyss theme is active */}
      <span className={`theme-toggle__icon ${theme === 'abyss' ? '' : 'theme-toggle__icon--hidden'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </svg>
      </span>
    </button>
  );
}
