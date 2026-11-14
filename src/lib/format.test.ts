import { describe, expect, it } from 'vitest';
import { formatPhone, formatSignedMoney } from './format';

describe('formatPhone', () => {
  it('agrupa un teléfono de 10 dígitos', () => {
    expect(formatPhone('5512345678')).toBe('55 1234 5678');
    expect(formatPhone('55 1234 5678')).toBe('55 1234 5678');
  });

  it('deja otros formatos como llegan', () => {
    expect(formatPhone('+1 555 0100')).toBe('+1 555 0100');
  });

  it('muestra el signo de un importe con signo sin recalcularlo', () => {
    expect(formatSignedMoney('-3200.00')).toBe('−$3,200');
    expect(formatSignedMoney('8500.00')).toBe('$8,500');
  });
});
