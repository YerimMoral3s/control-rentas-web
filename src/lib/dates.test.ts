import { describe, expect, it } from 'vitest';
import {
  formatDateRange,
  formatDateWithYear,
  formatLongDate,
  formatShortDate,
  monthName,
} from './dates';

describe('fechas civiles', () => {
  it('no se corren de día por la zona horaria del dispositivo', () => {
    expect(formatShortDate('2026-10-05')).toMatch(/^5 oct\.$/);
    expect(formatShortDate('2026-12-31')).toMatch(/^31 dic\.$/);
  });

  it('arma el encabezado de Inicio con la fecha operativa', () => {
    expect(formatLongDate('2026-10-27')).toBe('Martes 27 de octubre');
  });

  it('nombra el mes del periodo', () => {
    expect(monthName(2026, 10)).toBe('octubre');
  });

  it('muestra rangos de contrato con el año una sola vez si coincide', () => {
    expect(formatDateWithYear('2026-10-01')).toBe('1 oct. 2026');
    expect(formatDateRange('2026-10-01', '2027-09-30')).toBe('1 oct. 2026 – 30 sep. 2027');
    expect(formatDateRange('2026-04-01', '2026-09-30')).toBe('1 abr. – 30 sep. 2026');
  });
});
