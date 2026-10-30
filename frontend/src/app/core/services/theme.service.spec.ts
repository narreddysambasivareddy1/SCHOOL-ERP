import { paletteFromHex, normalizeHex } from './theme.service';

describe('paletteFromHex', () => {
  it('keeps the chosen colour as the primary token on the light shell', () => {
    const palette = paletteFromHex('#1D4E89');
    expect(palette?.['--primary']).toBe('#1d4e89');
    expect(palette?.['--canvas']).toBe('#f4f7fb');
    expect(palette?.['--surface']).toBe('#ffffff');
    expect(palette?.['--teal']).toBe('#0f8b8d');
    expect(palette?.['--gold']).toBe('#f2b544');
  });

  it('uses a dark shell while keeping the chosen accent', () => {
    const palette = paletteFromHex('#17365D', 'dark');
    expect(palette?.['--primary']).toBe('#17365d');
    expect(palette?.['--canvas']).toBe('#0b1220');
    expect(palette?.['--surface']).toBe('#121a2b');
    expect(palette?.['--ink']).toBe('#e8eef7');
  });

  it('rejects values that are not hex colours', () => {
    expect(normalizeHex('blue')).toBeNull();
    expect(paletteFromHex('nope')).toBeNull();
  });
});
