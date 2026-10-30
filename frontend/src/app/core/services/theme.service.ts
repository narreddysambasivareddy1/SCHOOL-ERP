import { Injectable, signal } from '@angular/core';

export interface ThemePreset {
  id: string;
  name: string;
  hex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'campus', name: 'Campus blue', hex: '#1d4e89' },
  { id: 'forest', name: 'Forest', hex: '#1f6b4a' },
  { id: 'indigo', name: 'Indigo', hex: '#3730a3' },
  { id: 'amber', name: 'Amber', hex: '#b45309' },
  { id: 'crimson', name: 'Crimson', hex: '#9f1239' },
  { id: 'slate', name: 'Slate', hex: '#334155' },
];

const STORAGE_KEY = 'erp_theme_color';
const DEFAULT_HEX = THEME_PRESETS[0].hex;

export function normalizeHex(value: string): string | null {
  const raw = value.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full = raw.length === 3 ? raw.split('').map(part => part + part).join('') : raw;
  return `#${full.toLowerCase()}`;
}

export function paletteFromHex(value: string): Record<string, string> | null {
  const hex = normalizeHex(value);
  if (!hex) return null;
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
  const sat = Math.min(68, Math.max(32, Math.round(saturation * 100)));
  const tone = (s: number, l: number) => `hsl(${hue} ${s}% ${l}%)`;
  return {
    '--primary': hex,
    '--primary-hover': tone(sat, 28),
    '--primary-soft': tone(Math.min(sat, 48), 93),
    '--navy': tone(Math.min(sat, 40), 16),
    '--navy2': tone(Math.min(sat, 40), 94),
    '--teal': tone(sat, 34),
    '--bg': tone(32, 93),
    '--canvas': tone(28, 91),
    '--ink': tone(24, 16),
    '--muted': tone(14, 34),
    '--line': tone(22, 82),
    '--sidebar': tone(Math.min(sat, 36), 14),
    '--sidebar-text': tone(20, 94),
    '--sidebar-muted': tone(16, 74),
    '--sidebar-active': hex,
    '--topbar': '#fffcf8',
    '--info': hex,
    '--info-soft': tone(Math.min(sat, 48), 93),
    '--focus': `0 0 0 3px hsl(${hue} ${sat}% 36% / 0.28)`,
  };
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly presets = THEME_PRESETS;
  readonly active = signal(DEFAULT_HEX);

  constructor() {
    this.paint(localStorage.getItem(STORAGE_KEY) || DEFAULT_HEX);
  }

  choose(hex: string) {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    localStorage.setItem(STORAGE_KEY, normalized);
    this.paint(normalized);
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
    const tokens = paletteFromHex(hex);
    if (!tokens) return;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    this.active.set(normalizeHex(hex) || DEFAULT_HEX);
  }
}
