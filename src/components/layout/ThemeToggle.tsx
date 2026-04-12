import React from 'react';
import { SunDim, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/ThemeToggle.css';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { themeMode, setThemeMode } = useTheme();

  const cycleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('auto');
    } else {
      setThemeMode('light');
    }
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return <SunDim className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'auto':
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to auto mode';
      case 'auto':
        return 'Switch to light mode';
    }
  };

  return (
    <button
      className={`p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all ${className}`.trim()}
      onClick={cycleTheme}
      aria-label={getLabel()}
      title={`Current: ${themeMode}`}
    >
      {getIcon()}
    </button>
  );
};

export default ThemeToggle;
