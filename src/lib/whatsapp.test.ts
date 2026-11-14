import { describe, expect, it } from 'vitest';
import { whatsappUrl } from './whatsapp';

describe('whatsappUrl', () => {
  it('agrega la lada de México a un número de 10 dígitos y codifica el mensaje', () => {
    expect(whatsappUrl('55 1234 5678', 'Hola María')).toBe(
      'https://wa.me/525512345678?text=Hola%20Mar%C3%ADa',
    );
  });

  it('respeta un número que ya trae lada', () => {
    expect(whatsappUrl('+52 55 1234 5678', 'x')).toBe('https://wa.me/525512345678?text=x');
  });
});
