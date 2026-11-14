import { describe, expect, it } from 'vitest';
import { formatPhone, formatSignedMoney, normalizeMexicanPhone } from './format';

describe('formatPhone', () => {
  it('agrupa un teléfono de 10 dígitos', () => {
    expect(formatPhone('5512345678')).toBe('55 12 34 56 78');
    expect(formatPhone('55 1234 5678')).toBe('55 12 34 56 78');
  });

  it('deja otros formatos como llegan', () => {
    expect(formatPhone('+1 555 0100')).toBe('+1 555 0100');
  });

  it('muestra el signo de un importe con signo sin recalcularlo', () => {
    expect(formatSignedMoney('-3200.00')).toBe('−$3,200');
    expect(formatSignedMoney('8500.00')).toBe('$8,500');
  });

  it('acepta solo teléfonos de México (FE-28)', () => {
    expect(normalizeMexicanPhone('55 1234 5678')).toBe('5512345678');
    expect(normalizeMexicanPhone('52 55 1234 5678')).toBe('5512345678');
    expect(normalizeMexicanPhone('5550011004000')).toBeNull();
    expect(normalizeMexicanPhone('1234')).toBeNull();
  });
});
