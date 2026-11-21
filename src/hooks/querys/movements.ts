import {
  getMovements,
  getMovementsHistory,
  getSourceHistory,
  type HistorySourceType,
  type MovementListParams,
  type SourceHistory,
} from '@api/movements';
import type { PaginatedMeta } from '@api/types';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type MovementFilters = Omit<MovementListParams, 'page' | 'page_size'>;

export const MovementsQueryKeys = {
  root: ['movements'] as const,
  recent: (filters: MovementFilters, size: number) =>
    ['movements', 'recent', filters, size] as const,
  list: (filters: MovementFilters) => ['movements', 'list', filters] as const,
  historyList: (sourceType: 'all' | HistorySourceType, search: string) =>
    ['movements', 'history', 'list', sourceType, search] as const,
  historyDetail: (sourceType: HistorySourceType, sourceId: string) =>
    ['movements', 'history', 'detail', sourceType, sourceId] as const,
};

/** Primeros movimientos con filtros, sin paginar (por ejemplo, Gastos recientes de un edificio). */
export const useRecentMovements = (filters: MovementFilters, size: number) =>
  useBaseQuery(
    MovementsQueryKeys.recent(filters, size),
    signal => getMovements({ ...filters, page: 1, page_size: size }, signal),
    QueryStaleTime.operational,
  );

/** M-01: movimientos con búsqueda, chip y filtros; conteos completos en `meta.counts`. */
export const useMovements = (filters: MovementFilters) =>
  useBaseInfiniteQuery(
    MovementsQueryKeys.list(filters),
    (page, signal) => getMovements({ ...filters, page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
    true,
    // Un movimiento no tiene ID propio: se identifica por su origen (pago o gasto).
    movement => `${movement.source.type}-${movement.source.id}`,
  );

/** M-05: pagos y gastos con correcciones; conteos all/payment/expense en `meta.counts`. */
export const useMovementsHistory = (sourceType: 'all' | HistorySourceType, search: string) =>
  useBaseInfiniteQuery(
    MovementsQueryKeys.historyList(sourceType, search),
    (page, signal) =>
      getMovementsHistory(
        {
          ...(sourceType !== 'all' ? { source_type: sourceType } : {}),
          ...(search ? { search } : {}),
          page,
          page_size: QueryPageSize.standard,
        },
        signal,
      ),
    QueryStaleTime.operational,
    true,
    origin => `${origin.source.type}-${origin.source.id}`,
  );

/**
 * M-06: historial de un pago o gasto. Las operaciones se paginan; el encabezado (resultado vigente
 * y conteo) viaja en `meta.history` y es el mismo en todas las páginas.
 */
export const useSourceHistory = (
  sourceType: HistorySourceType,
  sourceId: string | undefined,
  enabled = true,
) =>
  useBaseInfiniteQuery(
    MovementsQueryKeys.historyDetail(sourceType, sourceId ?? ''),
    async (page, signal) => {
      const response = await getSourceHistory(
        sourceType,
        sourceId ?? '',
        page,
        QueryPageSize.standard,
        signal,
      );
      const { operations, ...history } = response.data;
      return {
        ...response,
        data: operations,
        meta: { ...response.meta, history } as PaginatedMeta & {
          history: Omit<SourceHistory, 'operations'>;
        },
      };
    },
    QueryStaleTime.operational,
    enabled && Boolean(sourceId),
  );
