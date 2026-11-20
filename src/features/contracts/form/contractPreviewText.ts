import type { CreationPreview } from '@api/contracts';
import { formatDateWithYear, formatShortDate, monthName } from '@lib/dates';

/** Textos de las revisiones de P-10 y C-09. Los importes, estados y cobros vienen del servidor. */

/** "2026-10" → "Renta octubre 2026" */
export const rentTitle = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number) as [number, number];
  return `Renta ${monthName(year, month)} ${year}`;
};

/** C-09: "Octubre se creará como Vencido porque venció el 5 oct. Las demás, como Pendientes." */
export const overdueSentence = (
  rents: Array<{ period_key: string; due_date: string; status: string }>,
) => {
  const overdue = rents.filter(rent => rent.status === 'overdue');
  const first = overdue[0];
  if (!first) return null;
  const [year, month] = first.period_key.split('-').map(Number) as [number, number];
  const name = monthName(year, month);
  const lead =
    overdue.length === 1
      ? `${name.charAt(0).toUpperCase()}${name.slice(1)} se creará como Vencido porque venció el ${formatShortDate(first.due_date)}`
      : `${overdue.length} rentas se crearán como Vencidas porque ya vencieron.`;
  return rents.length > overdue.length ? `${lead} Las demás, como Pendientes.` : lead;
};

/**
 * "Venció el 5 oct." o "Vence el 5 nov." según el estado del servidor; con año si no es el de
 * `today` ("Vence el 5 ene. 2027").
 */
export const dueText = (
  charge: { due_date: string; status: 'pending' | 'overdue' },
  today?: string,
) => {
  const date =
    today && today.slice(0, 4) !== charge.due_date.slice(0, 4)
      ? formatDateWithYear(charge.due_date)
      : formatShortDate(charge.due_date);
  return `${charge.status === 'overdue' ? 'Venció' : 'Vence'} el ${date}`;
};

type Rent = CreationPreview['new_rents'][number];

/**
 * Cobros como los muestra el diseño: los vencidos y el primero pendiente uno por uno; el resto de
 * pendientes con el mismo importe, en una sola línea ("3 rentas · dic. 2026 a feb. 2027").
 */
export const groupRents = (rents: Rent[]) => {
  const firstPending = rents.findIndex(rent => rent.status === 'pending');
  const single = firstPending === -1 ? rents : rents.slice(0, firstPending + 1);
  const rest = firstPending === -1 ? [] : rents.slice(firstPending + 1);
  const sameAmount = rest.every(
    rent => rent.amount === rest[0]?.amount && rent.status === 'pending',
  );
  if (rest.length < 2 || !sameAmount) return { single: rents, group: null };
  const first = rest[0] as Rent;
  const last = rest[rest.length - 1] as Rent;
  const short = (key: string) => {
    const [year, month] = key.split('-').map(Number) as [number, number];
    return `${monthName(year, month).slice(0, 3)}. ${year}`;
  };
  return {
    single,
    group: {
      count: rest.length,
      range: `${short(first.period_key)} a ${short(last.period_key)}`,
      amount: first.amount,
    },
  };
};
