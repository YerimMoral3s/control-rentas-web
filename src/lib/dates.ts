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

/** Instantes de la API (UTC) se muestran en la hora operativa de México, no la del dispositivo. */
const OPERATIVE_TIME_ZONE = 'America/Mexico_City';

const instantDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OPERATIVE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const instantTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: OPERATIVE_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "2026-10-22T18:00:00Z" → fecha civil en México "2026-10-22". */
export const civilDateOf = (instant: string) => instantDateFormatter.format(new Date(instant));

/** "4 sep. 2026 a las 10:42" (hora de México). */
export const formatDateTime = (instant: string) =>
  `${formatDateWithYear(civilDateOf(instant))} a las ${instantTimeFormatter.format(new Date(instant))}`;

const weekdayFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: 'UTC' });

/** Encabezado de un día en Movimientos: "Lunes 26 oct. 2026". */
export const formatDayHeading = (date: string) => {
  const weekday = weekdayFormatter.format(parseCivil(date));
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${formatDateWithYear(date)}`;
};

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: OPERATIVE_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Hora de un instante en México: "10:24 a. m." (espacios no separables normalizados). */
export const formatTime = (instant: string) =>
  timeFormatter.format(new Date(instant)).replace(/\s+/g, ' ');

/** Mes civil "2026-10" desplazado `offset` meses: primer y último día y nombre ("Octubre 2026"). */
export const monthRange = (month: string, offset = 0) => {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const name = monthName(first.getUTCFullYear(), first.getUTCMonth() + 1);
  return {
    key: iso(first).slice(0, 7),
    from: iso(first),
    to: iso(last),
    label: `${name.charAt(0).toUpperCase()}${name.slice(1)} ${first.getUTCFullYear()}`,
  };
};
