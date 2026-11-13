import { describe, expect, it } from 'vitest';
import { formatMoneyInput, sanitizeMoney, sanitizePhone } from './numericInput';

describe('campos numéricos', () => {
  it('el importe solo acepta dígitos y un punto con hasta 2 decimales', () => {
    expect(sanitizeMoney('8,500xcxzasdad')).toBe('8500');
    expect(sanitizeMoney('12.3.45')).toBe('12.34');
    expect(sanitizeMoney('abc')).toBe('');
  });

  it('agrega separador de miles al salir del campo', () => {
    expect(formatMoneyInput('8500')).toBe('8,500');
    expect(formatMoneyInput('1234567.5')).toBe('1,234,567.5');
    expect(formatMoneyInput('')).toBe('');
  });

  it('el teléfono solo acepta dígitos y espacios', () => {
    expect(sanitizePhone('55 123asdasdasdsadas')).toBe('55 123');
    expect(sanitizePhone('55-1234-5678')).toBe('5512345678');
  });
});
