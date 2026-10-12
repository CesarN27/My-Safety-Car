import { normalizePhone, PHONE_PATTERN } from './phone.js';

describe('normalizePhone', () => {
  it('deja solo dígitos y antepone 52 a números de 10 dígitos', () => {
    expect(normalizePhone('55 3021 7788')).toBe('525530217788');
    expect(normalizePhone('(55) 3021-7788')).toBe('525530217788');
  });

  it('respeta números que ya traen lada', () => {
    expect(normalizePhone('+52 55 3021 7788')).toBe('525530217788');
  });

  it('rechaza lo que no parece un teléfono', () => {
    expect(PHONE_PATTERN.test('abc')).toBe(false);
    expect(PHONE_PATTERN.test('123')).toBe(false);
    expect(PHONE_PATTERN.test('55 3021 7788')).toBe(true);
  });
});
