import { useMutation } from '@tanstack/react-query';
import {
  createDepositRefund,
  deactivateExpense,
  getExpense,
  getExpenses,
  updateRefundAmount,
} from '@api/expenses';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type ExpenseFilters = { property_id?: string; unit_id?: string };

export const ExpensesQueryKeys = {
  root: ['expenses'] as const,
  list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
  detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
};

/** Gastos de una propiedad o unidad (sección Gastos de P-03, P-04 y U-01 a U-03). */
export const useExpenses = (filters: ExpenseFilters, enabled = true) =>
  useBaseInfiniteQuery(
    ExpensesQueryKeys.list(filters),
    (page, signal) => getExpenses({ ...filters, page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
    enabled,
  );

/** E-03: detalle de un gasto activo. */
export const useExpense = (expenseId: string | undefined) =>
  useBaseQuery(
    ExpensesQueryKeys.detail(expenseId ?? ''),
    signal => getExpense(expenseId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(expenseId) },
  );

/** Y-16: devolver el depósito. Sin reintentos: un error de red no se reenvía solo. */
export const useCreateDepositRefund = () =>
  useMutation({ retry: false, mutationFn: createDepositRefund });

/** Y-17: corregir el importe de la devolución. */
export const useUpdateRefundAmount = () =>
  useMutation({ retry: false, mutationFn: updateRefundAmount });

/** Y-17: eliminar (baja lógica) la devolución. */
export const useDeactivateExpense = () =>
  useMutation({ retry: false, mutationFn: deactivateExpense });
