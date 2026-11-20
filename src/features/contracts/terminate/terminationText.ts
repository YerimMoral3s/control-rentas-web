import type { TerminationSummary } from '@api/contracts';
import { formatShortDate, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "2 rentas y 1 cargo adicional" (solo lo que haya). */
export const cancelledText = (summary: TerminationSummary) =>
  [
    summary.cancelled_rents_count > 0
      ? plural(summary.cancelled_rents_count, 'renta', 'rentas')
      : null,
    summary.cancelled_additional_charges_count > 0
      ? plural(summary.cancelled_additional_charges_count, 'cargo adicional', 'cargos adicionales')
      : null,
  ]
    .filter(Boolean)
    .join(' y ');

/** "2026-12" → "Diciembre 2026" */
export const monthTitle = (periodKey: string) => {
  const year = Number(periodKey.slice(0, 4));
  const month = Number(periodKey.slice(5, 7));
  const name = monthName(year, month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
};

/** "Vence el 12 dic." (con año si no es el de la fecha operativa). */
export const chargeDue = (dueDate: string, asOf: string) =>
  `Vence el ${formatShortDate(dueDate)}${dueDate.slice(0, 4) === asOf.slice(0, 4) ? '' : ` ${dueDate.slice(0, 4)}`}`;

/** Lo que se conserva: "su pago atrasado de $8,500" o "sus cobros". */
export const retainedText = (summary: TerminationSummary) => {
  const { overdue_count: count, overdue_amount: amount } = summary.retained_payments;
  if (count === 0) return 'sus cobros';
  return `${count === 1 ? 'su pago atrasado' : 'sus pagos atrasados'} de ${formatMoney(amount)}`;
};
