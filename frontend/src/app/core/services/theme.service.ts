import { Injectable, signal } from '@angular/core';

export interface ThemePreset {
  id: string;
  name: string;
  hex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'campus', name: 'Campus navy', hex: '#17365d' },
  { id: 'forest', name: 'Forest', hex: '#1f6b4a' },
  { id: 'indigo', name: 'Indigo', hex: '#3730a3' },
  { id: 'amber', name: 'Amber', hex: '#b45309' },
  { id: 'crimson', name: 'Crimson', hex: '#9f1239' },
  { id: 'slate', name: 'Slate', hex: '#334155' },
];

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'erp_theme_color';
const MODE_KEY = 'erp_theme_mode';
const DEFAULT_HEX = THEME_PRESETS[0].hex;

export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full = raw.length === 3 ? raw.split('').map(part => part + part).join('') : raw;
  return `#${full.toLowerCase()}`;
}

function hueSat(hex: string) {
  const channel = (start: number) => parseInt(hex.slice(start, start + 2), 16) / 255;
  const r = channel(1);
  const g = channel(3);
  const b = channel(5);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  const delta = max - min;
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  return { hue, sat: Math.min(68, Math.max(32, Math.round(saturation * 100))) };
}

export function paletteFromHex(value: string, mode: ThemeMode = 'light'): Record<string, string> | null {
  const hex = normalizeHex(value);
  if (!hex) return null;
  const { hue, sat } = hueSat(hex);
  const tone = (s: number, l: number) => `hsl(${hue} ${s}% ${l}%)`;
  if (mode === 'dark') {
    return {
      '--primary': hex,
      '--primary-hover': tone(sat, 64),
      '--primary-soft': `hsl(${hue} ${sat}% 64% / 0.16)`,
      '--navy': '#e8eef7',
      '--navy2': '#182236',
      '--teal': '#2aa8aa',
      '--gold': '#f2b544',
      '--bg': '#0e1626',
      '--canvas': '#0b1220',
      '--ink': '#e8eef7',
      '--muted': '#9aabc0',
      '--line': '#243044',
      '--white': '#121a2b',
      '--surface': '#121a2b',
      '--surface-raised': '#182236',
      '--sidebar': '#070d18',
      '--sidebar-text': '#e8eef7',
      '--sidebar-muted': '#8ea0b8',
      '--sidebar-active': hex,
      '--topbar': '#0e1626',
      '--info': hex,
      '--info-soft': `hsl(${hue} ${sat}% 64% / 0.16)`,
      '--success': '#3dbe9a',
      '--success-soft': '#12352c',
      '--warn': '#f2b544',
      '--warn-soft': '#3a2d12',
      '--danger': '#f07178',
      '--danger-soft': '#3a1c22',
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.35)',
      '--shadow': '0 16px 40px rgba(0, 0, 0, 0.45)',
      '--focus': `0 0 0 3px hsl(${hue} ${sat}% 64% / 0.35)`,
    };
  }
  return {
    '--primary': hex,
    '--primary-hover': tone(sat, 28),
    '--primary-soft': tone(Math.min(sat, 42), 94),
    '--navy': '#17365d',
    '--navy2': '#e7eef6',
    '--teal': '#0f8b8d',
    '--gold': '#f2b544',
    '--bg': '#f4f7fb',
    '--canvas': '#f4f7fb',
    '--ink': '#17365d',
    '--muted': '#4d6278',
    '--line': '#d7e0ea',
    '--white': '#ffffff',
    '--surface': '#ffffff',
    '--surface-raised': '#ffffff',
    '--sidebar': '#17365d',
    '--sidebar-text': '#f4f7fb',
    '--sidebar-muted': '#c5d2e2',
    '--sidebar-active': hex,
    '--topbar': '#ffffff',
    '--info': hex,
    '--info-soft': tone(Math.min(sat, 42), 94),
    '--success': '#0f8b8d',
    '--success-soft': '#e5f6f6',
    '--warn': '#9a6b12',
    '--warn-soft': '#fff6e0',
    '--danger': '#c0392b',
    '--danger-soft': '#fff0f0',
    '--shadow-sm': '0 2px 8px rgba(23, 54, 93, 0.06)',
    '--shadow': '0 10px 28px rgba(23, 54, 93, 0.10)',
    '--focus': `0 0 0 3px hsl(${hue} ${sat}% 36% / 0.28)`,
  };
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly presets = THEME_PRESETS;
  readonly active = signal(DEFAULT_HEX);
  readonly mode = signal<ThemeMode>('light');

  constructor() {
    this.mode.set(localStorage.getItem(MODE_KEY) === 'dark' ? 'dark' : 'light');
    this.paint(localStorage.getItem(STORAGE_KEY) || DEFAULT_HEX);
  }

  choose(hex: string) {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    localStorage.setItem(STORAGE_KEY, normalized);
    this.paint(normalized);
  }

  setMode(mode: ThemeMode) {
    localStorage.setItem(MODE_KEY, mode);
    this.mode.set(mode);
    this.paint(this.active());
  }

  applySchoolColor(hex?: string | null) {
    if (localStorage.getItem(STORAGE_KEY)) return;
    this.paint(normalizeHex(hex || '') || DEFAULT_HEX);
  }

  resetToSchool(hex?: string | null) {
    localStorage.removeItem(STORAGE_KEY);
    this.paint(normalizeHex(hex || '') || DEFAULT_HEX);
  }

  private paint(hex: string) {
    const tokens = paletteFromHex(hex, this.mode());
    if (!tokens) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', this.mode());
    root.style.colorScheme = this.mode();
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    this.active.set(normalizeHex(hex) || DEFAULT_HEX);
  }
}
