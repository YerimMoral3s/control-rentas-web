import type { Contract } from '@api/contracts';
import type { Payment } from '@api/payments';
import { civilDateOf, formatDateRange, formatDateWithYear, formatShortDate } from '@lib/dates';
import { dueLabel } from '@lib/paymentText';

/** Textos de contratos y sus cobros, solo presentación. */

export const contractTypeShort = (contract: Pick<Contract, 'contract_type'>) =>
  contract.contract_type === 'trial' ? 'Prueba' : 'Formal';

/** "Formal · 12 meses" */
export const contractKindLine = (contract: Pick<Contract, 'contract_type' | 'duration_months'>) =>
  `${contractTypeShort(contract)} · ${contract.duration_months} ${contract.duration_months === 1 ? 'mes' : 'meses'}`;

/** Fecha en que terminó un contrato terminado: salida registrada o terminación anticipada. */
export const terminationDate = (
  contract: Pick<Contract, 'vacated_at' | 'terminated_early_at' | 'end_date'>,
) => {
  const instant = contract.vacated_at ?? contract.terminated_early_at;
  return instant ? civilDateOf(instant) : contract.end_date;
};

/**
 * Línea de fechas de la lista (C-01): "Venció el 30 sep. 2026 · sigue rentando",
 * "Terminó el 22 oct. 2026" o el rango "1 oct. 2026 – 30 sep. 2027".
 */
export const contractDatesLine = (contract: Contract) => {
  if (contract.status === 'terminated')
    return `Terminó el ${formatDateWithYear(terminationDate(contract))}`;
  if (contract.status === 'expired' && contract.is_current) {
    return `Venció el ${formatDateWithYear(contract.end_date)} · sigue rentando`;
  }
  return formatDateRange(contract.start_date, contract.end_date);
};

/** Segunda línea de un cobro en la lista del contrato. */
export const paymentDateLine = (payment: Payment, today: string | undefined) => {
  if (payment.status === 'paid' && payment.paid_at) {
    return `Pagado el ${formatShortDate(civilDateOf(payment.paid_at))}`;
  }
  if (payment.status === 'cancelled' && payment.canceled_at) {
    return `Cancelado el ${formatShortDate(civilDateOf(payment.canceled_at))}`;
  }
  return dueLabel(payment, today);
};
