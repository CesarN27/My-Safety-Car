import { STROKE_PATTERN } from './signature.js';

describe('STROKE_PATTERN (trazos de la firma)', () => {
  it('acepta lo que genera el frontend', () => {
    expect(STROKE_PATTERN.test('M10.5,20.0')).toBe(true);
    expect(STROKE_PATTERN.test('M10.5,20.0 L11.0,21.3 L-0.5,22.0')).toBe(true);
  });

  it('rechaza cualquier cosa que pueda romper el atributo d="…" de la hoja', () => {
    for (const bad of [
      'M10,20" onload="alert(1)',
      'M10,20 L5,5"/><script>alert(1)</script>',
      'M10,20 Z',
      'L10,20',
      'M10,20 L',
      '',
      'M10,20\nL5,5',
    ])
      expect(STROKE_PATTERN.test(bad)).toBe(false);
  });
});
