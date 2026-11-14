import { getMovements, type MovementListParams } from '@api/movements';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type MovementFilters = Omit<MovementListParams, 'page' | 'page_size'>;

export const MovementsQueryKeys = {
  root: ['movements'] as const,
  recent: (filters: MovementFilters, size: number) =>
    ['movements', 'recent', filters, size] as const,
  list: (filters: MovementFilters) => ['movements', 'list', filters] as const,
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
