import type { CreationPreview } from '@api/contracts';
import { formatShortDate, monthName } from '@lib/dates';

/** Textos de la revisión de P-10. Los importes, estados y cobros vienen del servidor. */

/** "2026-10" → "Renta octubre 2026" */
export const rentTitle = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number) as [number, number];
  return `Renta ${monthName(year, month)} ${year}`;
};

/** "Venció el 5 oct." o "Vence el 5 nov." según el estado del servidor. */
export const dueText = (charge: { due_date: string; status: 'pending' | 'overdue' }) =>
  `${charge.status === 'overdue' ? 'Venció' : 'Vence'} el ${formatShortDate(charge.due_date)}`;

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
