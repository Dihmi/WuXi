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
  {
    id:     'moss',
    name:   'Moss',
    desc:   'Dark forest',
    swatch: ['#020a04', '#071408', '#22c55e'],
    group:  'dark',
  },
  {
    id:     'obsidian',
    name:   'Obsidian',
    desc:   'Electric indigo',
    swatch: ['#04030e', '#0a0920', '#818cf8'],
    group:  'dark',
  },
  {
    id:     'void',
    name:   'Void',
    desc:   'Neon cyan',
    swatch: ['#010109', '#050520', '#06b6d4'],
    group:  'dark',
  },
  {
    id:     'crimson',
    name:   'Crimson',
    desc:   'Blood moon',
    swatch: ['#0e0204', '#1e0508', '#ef4444'],
    group:  'dark',
  },
  {
    id:     'dusk',
    name:   'Dusk',
    desc:   'Warm amber',
    swatch: ['#0e0c08', '#201e18', '#f59e0b'],
    group:  'dark',
  },
  {
    id:     'matrix',
    name:   'Matrix',
    desc:   'Neon terminal',
    swatch: ['#0d1318', '#141e26', '#00e090'],
    group:  'dark',
  },
  {
    id:     'iron',
    name:   'Iron',
    desc:   'Neutral gray, sky blue',
    swatch: ['#171717', '#1f1f1f', '#0ea5e9'],
    group:  'dark',
  },
  {
    id:     'carbon',
    name:   'Carbon',
    desc:   'Pure charcoal, lime',
    swatch: ['#141414', '#1e1e1e', '#a3e635'],
    group:  'dark',
  },
  {
    id:     'onyx',
    name:   'Onyx',
    desc:   'Dark gray, coral',
    swatch: ['#161616', '#1e1e1e', '#fb7185'],
    group:  'dark',
  },
  {
    id:     'steel',
    name:   'Steel',
    desc:   'Cool gray, amber',
    swatch: ['#161618', '#1e1e22', '#f59e0b'],
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
  {
    id:     'sage',
    name:   'Sage',
    desc:   'Forest green',
    swatch: ['#f4faf4', '#ffffff', '#16a34a'],
    group:  'light',
  },
  {
    id:     'sand',
    name:   'Sand',
    desc:   'Desert rust',
    swatch: ['#faf8f2', '#ffffff', '#c2410c'],
    group:  'light',
  },
  {
    id:     'mint',
    name:   'Mint',
    desc:   'Fresh teal',
    swatch: ['#f0faf9', '#ffffff', '#0d9488'],
    group:  'light',
  },
  {
    id:     'iris',
    name:   'Iris',
    desc:   'Soft violet',
    swatch: ['#f6f4ff', '#ffffff', '#7c3aed'],
    group:  'light',
  },
  {
    id:     'citrus',
    name:   'Citrus',
    desc:   'Lime grove',
    swatch: ['#f8fff0', '#ffffff', '#65a30d'],
    group:  'light',
  },
  {
    id:     'terminal',
    name:   'Terminal',
    desc:   'Bright teal',
    swatch: ['#eef8f5', '#fafefe', '#00a878'],
    group:  'light',
  },
  {
    id:     'paper',
    name:   'Paper',
    desc:   'Pure gray, indigo',
    swatch: ['#f4f4f5', '#fafafa', '#4f46e5'],
    group:  'light',
  },
  {
    id:     'stone',
    name:   'Stone',
    desc:   'Neutral gray, crimson',
    swatch: ['#f5f5f5', '#fafafa', '#e11d48'],
    group:  'light',
  },
  {
    id:     'chalk',
    name:   'Chalk',
    desc:   'Clean white, cyan',
    swatch: ['#f6f6f6', '#ffffff', '#0891b2'],
    group:  'light',
  },
  {
    id:     'pumice',
    name:   'Pumice',
    desc:   'Warm white, orange',
    swatch: ['#f5f4f0', '#faf9f7', '#ea580c'],
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
