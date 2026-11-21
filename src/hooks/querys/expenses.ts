import { useMutation } from '@tanstack/react-query';
import { getProperties, type Property } from '@api/properties';
import type { ApiSuccess } from '@api/types';
import { getUnits, type Unit } from '@api/units';
import {
  createDepositRefund,
  createExpense,
  deactivateExpense,
  getExpense,
  getExpenses,
  previewExpenseUpdate,
  updateExpense,
  updateRefundAmount,
} from '@api/expenses';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type ExpenseFilters = { property_id?: string; unit_id?: string };

export const ExpensesQueryKeys = {
  root: ['expenses'] as const,
  list: (filters: ExpenseFilters) => ['expenses', 'list', filters] as const,
  detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
  /** Destinos para registrar un gasto: todas las propiedades activas y sus unidades. */
  destinations: ['expenses', 'destinations'] as const,
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

/** E-01: registrar un gasto. */
export const useCreateExpense = () => useMutation({ retry: false, mutationFn: createExpense });

export type ExpenseDestinations = { properties: Property[]; units: Unit[] };

/**
 * Selector de destino (E-01): todas las propiedades activas y sus unidades no inactivas, en páginas
 * de 100. Se busca y agrupa aquí; el servidor vuelve a validar el destino al guardar.
 */
export const useExpenseDestinations = () =>
  useBaseQuery(
    ExpensesQueryKeys.destinations,
    async (signal): Promise<ApiSuccess<ExpenseDestinations>> => {
      const properties: Property[] = [];
      for (let page = 1; ; page += 1) {
        const response = await getProperties({ page, page_size: QueryPageSize.max }, signal);
        properties.push(...response.data);
        if (!response.meta.pagination.has_next) break;
      }
      const units: Unit[] = [];
      for (let page = 1; ; page += 1) {
        const response = await getUnits({ page, page_size: QueryPageSize.max }, signal);
        units.push(...response.data);
        if (!response.meta.pagination.has_next)
          return { data: { properties, units }, meta: response.meta };
      }
    },
    QueryStaleTime.operational,
  );

/** E-04: revisión de la edición (FE-38). */
export const usePreviewExpenseUpdate = () =>
  useMutation({ retry: false, mutationFn: previewExpenseUpdate });

/** E-04: editar un gasto general. */
export const useUpdateExpense = () => useMutation({ retry: false, mutationFn: updateExpense });
