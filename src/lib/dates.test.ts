import { describe, expect, it } from 'vitest';
import {
  civilDateOf,
  contractEndDate,
  nextDay,
  formatDateRange,
  formatDateTime,
  formatDayHeading,
  formatTime,
  monthRange,
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

  it('muestra instantes de la API en la hora de México', () => {
    // 01:30 UTC del 5 de septiembre es todavía 4 de septiembre en México.
    expect(civilDateOf('2026-09-05T01:30:00.000Z')).toBe('2026-09-04');
    expect(formatDateTime('2026-09-04T16:42:00.000Z')).toBe('4 sep. 2026 a las 10:42');
  });

  it('arma encabezados de día, hora y meses para Movimientos', () => {
    expect(formatDayHeading('2026-10-26')).toBe('Lunes 26 oct. 2026');
    expect(formatTime('2026-10-27T16:24:00.000Z')).toMatch(/^10:24 a\.\s?m\.$/);
    expect(monthRange('2026-11')).toEqual({
      key: '2026-11',
      from: '2026-11-01',
      to: '2026-11-30',
      label: 'Noviembre 2026',
    });
    expect(monthRange('2026-01', -1)).toMatchObject({
      key: '2025-12',
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });
});

describe('fin de contrato preexistente (misma regla que BACK)', () => {
  it('inicio + duración − 1 día', () => {
    expect(contractEndDate('2026-03-01', 12)).toBe('2027-02-28');
    expect(contractEndDate('2025-10-01', 12)).toBe('2026-09-30');
    expect(contractEndDate('2026-06-15', 6)).toBe('2026-12-14');
  });

  it('acota el día al último del mes destino', () => {
    expect(contractEndDate('2026-08-31', 6)).toBe('2027-02-27');
    expect(contractEndDate('2027-08-31', 6)).toBe('2028-02-28');
  });
});

describe('inicio de una continuidad', () => {
  it('es el día siguiente al fin anterior', () => {
    expect(nextDay('2026-09-30')).toBe('2026-10-01');
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
    expect(nextDay('2028-02-28')).toBe('2028-02-29');
  });
});
