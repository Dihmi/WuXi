import { useState, useEffect, useCallback } from 'react';

export const THEMES = [
  {
    id:      'midnight',
    name:    'Midnight',
    desc:    'Dark violet',
    swatch:  ['#09090c', '#131318', '#8b7ff5'],
  },
  {
    id:      'aurora',
    name:    'Aurora',
    desc:    'Deep teal',
    swatch:  ['#030d0d', '#0a1c1c', '#00d4b8'],
  },
  {
    id:      'ember',
    name:    'Ember',
    desc:    'Warm amber',
    swatch:  ['#0c0907', '#1a1208', '#f0823a'],
  },
  {
    id:      'sakura',
    name:    'Sakura',
    desc:    'Dark rose',
    swatch:  ['#0d070a', '#1a0d14', '#e8609a'],
  },
  {
    id:      'slate',
    name:    'Slate',
    desc:    'Cool blue',
    swatch:  ['#07090c', '#111520', '#4d9cf0'],
  },
];

export default function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('wuxi_theme') || 'midnight'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const applyTheme = useCallback((id) => {
    localStorage.setItem('wuxi_theme', id);
    setTheme(id);
  }, []);

  return { theme, applyTheme, themes: THEMES };
}
