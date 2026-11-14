import type { ExpenseType } from '@api/expenses';
import type { PaymentType } from '@api/payments';

/** Nombres visibles de tipos de cobro y categorías de gasto (UI/UX, Movimientos y Gastos). */

const PAYMENT_TYPE: Record<PaymentType, string> = {
  monthly_rent: 'Renta',
  deposit: 'Depósito',
  additional_services: 'Cargo adicional',
};

const EXPENSE_TYPE: Record<ExpenseType, string> = {
  maintenance: 'Mantenimiento',
  cleaning: 'Limpieza',
  utilities: 'Servicios públicos',
  taxes: 'Impuestos',
  administrative: 'Administrativos',
  deposit_refund: 'Devolución de depósito',
  other: 'Otros',
};

export const PAYMENT_TYPES = Object.keys(PAYMENT_TYPE) as PaymentType[];
export const EXPENSE_TYPES = Object.keys(EXPENSE_TYPE) as ExpenseType[];

export const expenseTypeLabel = (type: ExpenseType) => EXPENSE_TYPE[type];

/** Tipo de un movimiento, sea cobro o gasto. */
export const movementTypeName = (type: PaymentType | ExpenseType) =>
  type in PAYMENT_TYPE ? PAYMENT_TYPE[type as PaymentType] : EXPENSE_TYPE[type as ExpenseType];
