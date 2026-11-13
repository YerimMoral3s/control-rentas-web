import { apiRequest } from './http';
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
  property: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
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
