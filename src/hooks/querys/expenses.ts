import { getExpenses } from '@api/expenses';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery } from './queryBase';

type ExpenseFilters = { property_id?: string; unit_id?: string };

export const ExpensesQueryKeys = {
  root: ['expenses'] as const,
  list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
};

/** Gastos de una propiedad o unidad (sección Gastos de P-03, P-04 y U-01 a U-03). */
export const useExpenses = (filters: ExpenseFilters, enabled = true) =>
  useBaseInfiniteQuery(
    ExpensesQueryKeys.list(filters),
    (page, signal) => getExpenses({ ...filters, page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
    enabled,
  );
