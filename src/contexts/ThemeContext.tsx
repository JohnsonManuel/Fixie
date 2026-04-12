import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';
type Theme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

function getSystemTheme(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved || 'auto';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return getSystemTheme();
  });

  useEffect(() => {
    // Save theme mode to localStorage
    localStorage.setItem('themeMode', themeMode);

    // Determine actual theme based on mode
    let actualTheme: Theme;
    if (themeMode === 'auto') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = themeMode;
    }

    setTheme(actualTheme);

    // Apply theme to document for Tailwind "class" strategy
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Also keep data-theme for any other selectors
    document.documentElement.setAttribute('data-theme', actualTheme);
    document.body.className = `theme-${actualTheme}`;
  }, [themeMode]);

  useEffect(() => {
    // Listen for system theme changes when in auto mode
    if (themeMode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newTheme = getSystemTheme();
      setTheme(newTheme);

      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.className = `theme-${newTheme}`;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
