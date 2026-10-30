import { paletteFromHex, normalizeHex } from './theme.service';

describe('paletteFromHex', () => {
  it('keeps the chosen colour as the primary token', () => {
    const palette = paletteFromHex('#1D4E89');
    expect(palette?.['--primary']).toBe('#1d4e89');
    expect(palette?.['--sidebar']).not.toBe('#1d4e89');
    expect(palette?.['--canvas']).toContain('hsl(');
  });

  it('rejects values that are not hex colours', () => {
    expect(normalizeHex('blue')).toBeNull();
    expect(paletteFromHex('nope')).toBeNull();
  });
});
