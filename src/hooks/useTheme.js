import { useState, useEffect, useCallback } from 'react';

export const THEMES = [
  /* ── Dark ─────────────────────────────────────────────────── */
  {
    id:     'midnight',
    name:   'Midnight',
    desc:   'Deep violet',
    swatch: ['#0a0810', '#14101e', '#8b7ff5'],
    group:  'dark',
  },
  {
    id:     'aurora',
    name:   'Aurora',
    desc:   'Space teal',
    swatch: ['#030e10', '#082022', '#00d4b8'],
    group:  'dark',
  },
  {
    id:     'ember',
    name:   'Ember',
    desc:   'Hot embers',
    swatch: ['#100a04', '#221408', '#f07830'],
    group:  'dark',
  },
  {
    id:     'sakura',
    name:   'Sakura',
    desc:   'Dark rose',
    swatch: ['#0f0609', '#200e16', '#e8609a'],
    group:  'dark',
  },
  {
    id:     'slate',
    name:   'Slate',
    desc:   'Deep navy',
    swatch: ['#060810', '#0e1424', '#4d9cf0'],
    group:  'dark',
  },
  /* ── Light ────────────────────────────────────────────────── */
  {
    id:     'dawn',
    name:   'Dawn',
    desc:   'Warm parchment',
    swatch: ['#faf8f3', '#ffffff', '#7c6ef0'],
    group:  'light',
  },
  {
    id:     'cloud',
    name:   'Cloud',
    desc:   'Airy blue',
    swatch: ['#f3f6fb', '#ffffff', '#3b82f6'],
    group:  'light',
  },
  {
    id:     'petal',
    name:   'Petal',
    desc:   'Blush rose',
    swatch: ['#fdf5f8', '#ffffff', '#db2777'],
    group:  'light',
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
