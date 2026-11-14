import { describe, expect, it } from 'vitest';
import {
  formatMoneyInput,
  maskCaret,
  sanitizeDigits,
  sanitizeMoney,
  sanitizePhone,
} from './numericInput';

describe('campos numéricos', () => {
  it('el importe solo acepta dígitos y un punto con hasta 2 decimales', () => {
    expect(sanitizeMoney('8,500xcxzasdad')).toBe('8500');
    expect(sanitizeMoney('12.3.45')).toBe('12.34');
    expect(sanitizeMoney('abc')).toBe('');
  });

  it('agrega separador de miles mientras se escribe y respeta el máximo de la API', () => {
    expect(formatMoneyInput('8500')).toBe('8,500');
    expect(formatMoneyInput('1,234,5678')).toBe('12,345,678');
    expect(formatMoneyInput('1234567.5')).toBe('1,234,567.5');
    expect(formatMoneyInput('100000000000')).toBe('1,000,000,000');
    expect(formatMoneyInput('000,000,000.56')).toBe('0.56');
    expect(formatMoneyInput('0075')).toBe('75');
    expect(formatMoneyInput('.5')).toBe('0.5');
    expect(formatMoneyInput('')).toBe('');
  });

  it('el teléfono solo acepta dígitos y espacios', () => {
    expect(sanitizePhone('55 123asdasdasdsadas')).toBe('55 12 3');
    expect(sanitizePhone('55-1234-5678')).toBe('55 12 34 56 78');
    expect(sanitizePhone('5512345678999')).toBe('55 12 34 56 78');
    expect(sanitizePhone('+52 55 1234 5678', true)).toBe('55 12 34 56 78');
    expect(sanitizePhone('5212345678')).toBe('52 12 34 56 78');
  });

  it('deja el cursor junto al mismo dígito al aplicar la máscara', () => {
    expect(maskCaret('55 12 34', 3)).toBe(4);
    expect(maskCaret('55 12 34', 0)).toBe(0);
    expect(maskCaret('12,345.5', 4, /[\d.]/)).toBe(5);
  });

  it('los campos de solo números no aceptan letras ni símbolos', () => {
    expect(sanitizeDigits('1dasd')).toBe('1');
    expect(sanitizeDigits('a1b2-3.4')).toBe('1234');
    expect(sanitizeDigits('asdsa')).toBe('');
  });
});
