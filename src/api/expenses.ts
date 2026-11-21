import { apiRequest } from './http';
import type { PropertyType } from './properties';
import type { PaginatedMeta } from './types';

/** Contrato: apis/expenses_api_control_rentas.txt */

export type ExpenseType =
  | 'maintenance'
  | 'cleaning'
  | 'utilities'
  | 'taxes'
  | 'administrative'
  | 'deposit_refund'
  | 'other';

export type Expense = {
  id: string;
  expense_type: ExpenseType;
  status: 'active' | 'inactive';
  amount: string;
  expense_date: string;
  description: string | null;
  related_contract_id: string | null;
  /** Exactamente uno de property/unit en un gasto ordinario. */
  property: { id: string; name: string; property_type: PropertyType } | null;
  /** FE-25: la API ya entrega la propiedad de la unidad (falta en la ficha de BACK); se trata como opcional. */
  unit: {
    id: string;
    name: string;
    property?: { id: string; name: string; property_type: PropertyType };
  } | null;
  deactivated_at: string | null;
  deposit_payment: { id: string } | null;
  created_at: string;
  updated_at: string;
};

type ExpenseListParams = {
  property_id?: string;
  unit_id?: string;
  page: number;
  page_size: number;
};

/** GET /v1/expenses — gastos activos, del más reciente al más antiguo. */
export const getExpenses = (params: ExpenseListParams, signal?: AbortSignal) =>
  apiRequest<Expense[], PaginatedMeta>({
    method: 'GET',
    url: '/expenses',
    params,
    signal,
    operation: 'expenses_list',
  });

/** GET /v1/expenses/:id — solo gastos activos (uno inactivo responde 404). */
export const getExpense = (expenseId: string, signal?: AbortSignal) =>
  apiRequest<Expense>({
    method: 'GET',
    url: `/expenses/${encodeURIComponent(expenseId)}`,
    signal,
    operation: 'expense_detail',
  });

/** POST /v1/expenses/deposit-refunds — devolución con la fecha de hoy del servidor (Y-16). */
export const createDepositRefund = (body: { deposit_payment_id: string; amount: number }) =>
  apiRequest<Expense>({
    method: 'POST',
    url: '/expenses/deposit-refunds',
    data: body,
    operation: 'deposit_refund_create',
  });

/** PATCH /v1/expenses/:id — en una devolución solo cambia el importe (Y-17). */
export const updateRefundAmount = ({ expenseId, amount }: { expenseId: string; amount: number }) =>
  apiRequest<Expense>({
    method: 'PATCH',
    url: `/expenses/${encodeURIComponent(expenseId)}`,
    data: { amount },
    operation: 'deposit_refund_update',
  });

/** PATCH /v1/expenses/:id/deactivate — baja lógica; se conserva el registro (Y-17). */
export const deactivateExpense = (expenseId: string) =>
  apiRequest<{ id: string; status: 'inactive'; deactivated_at: string | null }>({
    method: 'PATCH',
    url: `/expenses/${encodeURIComponent(expenseId)}/deactivate`,
    operation: 'expense_deactivate',
  });

/** E-01: categorías de un gasto general (la devolución de depósito se registra desde el depósito). */
export type GeneralExpenseType = Exclude<ExpenseType, 'deposit_refund'>;

/** E-01 / E-02: exactamente un destino (propiedad o unidad) y contrato opcional como referencia. */
export type ExpenseInput = {
  property_id?: string;
  unit_id?: string;
  related_contract_id?: string | null;
  expense_type: GeneralExpenseType;
  amount: number;
  expense_date: string;
  description?: string | null;
};

/** POST /v1/expenses — 201 con el gasto creado. */
export const createExpense = (body: ExpenseInput) =>
  apiRequest<Expense>({
    method: 'POST',
    url: '/expenses',
    data: body,
    operation: 'expense_create',
  });

/** E-04: cambios de un gasto general; solo se manda lo que cambió. */
export type ExpenseChanges = {
  property_id?: string | null;
  unit_id?: string | null;
  /** null quita la referencia al contrato de forma explícita. */
  related_contract_id?: string | null;
  expense_type?: GeneralExpenseType;
  amount?: number;
  expense_date?: string;
  description?: string | null;
};

/** E-04: estado vigente y propuesto de un gasto (FE-38). */
export type ExpenseReviewState = {
  id: string;
  expense_type: ExpenseType;
  status: 'active';
  amount: string;
  expense_date: string;
  description: string | null;
  property: { id: string; name: string; property_type: PropertyType } | null;
  unit: {
    id: string;
    name: string;
    property: { id: string; name: string; property_type: PropertyType };
  } | null;
  related_contract_id: string | null;
  deposit_payment: { id: string } | null;
};

export type ExpenseUpdatePreview = {
  before: ExpenseReviewState;
  after: ExpenseReviewState;
  preview_token: string;
};

/** POST /v1/expenses/:id/preview — no modifica nada (E-04). */
export const previewExpenseUpdate = ({
  expenseId,
  changes,
}: {
  expenseId: string;
  changes: ExpenseChanges;
}) =>
  apiRequest<ExpenseUpdatePreview>({
    method: 'POST',
    url: `/expenses/${encodeURIComponent(expenseId)}/preview`,
    data: changes,
    operation: 'expense_update_preview',
  });

/** PATCH /v1/expenses/:id — los mismos campos y el token de su revisión (E-04). */
export const updateExpense = ({
  expenseId,
  changes,
  previewToken,
}: {
  expenseId: string;
  changes: ExpenseChanges;
  previewToken: string;
}) =>
  apiRequest<Expense>({
    method: 'PATCH',
    url: `/expenses/${encodeURIComponent(expenseId)}`,
    data: { ...changes, preview_token: previewToken },
    operation: 'expense_update',
  });
