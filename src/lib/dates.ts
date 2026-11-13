/**
 * Fechas civiles (YYYY-MM-DD) de la API: se muestran sin convertir zona horaria.
 * "Hoy" siempre llega del servidor (America/Mexico_City); nunca se toma del dispositivo.
 */

const parseCivil = (date: string) => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const shortFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const longFormatter = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const monthFormatter = new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' });

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "2026-10-05" → "5 oct." */
export const formatShortDate = (date: string) => {
  const text = shortFormatter.format(parseCivil(date));
  return text.endsWith('.') ? text : `${text}.`;
};

/** "2026-10-27" → "Martes 27 de octubre" */
export const formatLongDate = (date: string) =>
  capitalize(longFormatter.format(parseCivil(date)).replace(',', ''));

/** "2026-10" o año y mes → "octubre" */
export const monthName = (year: number, month: number) =>
  monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));

/** "2026-10-01" → "1 oct. 2026" */
export const formatDateWithYear = (date: string) => `${formatShortDate(date)} ${date.slice(0, 4)}`;

/** "1 oct. 2026 – 30 sep. 2027"; en el mismo año: "1 abr. – 30 sep. 2026". */
export const formatDateRange = (start: string, end: string) =>
  start.slice(0, 4) === end.slice(0, 4)
    ? `${formatShortDate(start)} – ${formatDateWithYear(end)}`
    : `${formatDateWithYear(start)} – ${formatDateWithYear(end)}`;
