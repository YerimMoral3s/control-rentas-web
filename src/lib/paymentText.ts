import type { Payment } from '@api/payments';
import { formatShortDate, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';

/** Textos de un cobro, solo presentación (no calcula importes ni estados). */

export const tenantName = (tenant: Payment['tenant']) => `${tenant.first_name} ${tenant.last_name}`;

/** "Renta octubre", "Depósito" o el concepto capturado del cargo adicional. */
export const paymentConcept = (payment: Payment) => {
  if (payment.payment_type === 'deposit') return 'Depósito';
  if (payment.payment_type === 'additional_services')
    return payment.concept_reference || 'Cargo adicional';
  if (payment.period_year && payment.period_month) {
    return `Renta ${monthName(payment.period_year, payment.period_month)}`;
  }
  return 'Renta';
};

/** "Venció el 5 oct.", "Vence hoy" o "Vence el 29 oct.", con la fecha operativa del servidor. */
export const dueLabel = (payment: Payment, today: string | undefined) => {
  if (payment.status === 'overdue') return `Venció el ${formatShortDate(payment.due_date)}`;
  if (today && payment.due_date === today) return 'Vence hoy';
  return `Vence el ${formatShortDate(payment.due_date)}`;
};

/** Mensaje precargado para WhatsApp: amable y sin enviarse solo. */
export const whatsappMessage = (payment: Payment, today: string | undefined) =>
  `Hola ${payment.tenant.first_name}, te escribo por ${paymentConcept(payment).toLowerCase()} de ` +
  `${payment.unit.name} por ${formatMoney(payment.amount)}. ${dueLabel(payment, today)}. ¡Gracias!`;
