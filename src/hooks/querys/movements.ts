import { getMovements, type MovementListParams } from '@api/movements';
import { QueryStaleTime, useBaseQuery } from './queryBase';

type MovementFilters = Omit<MovementListParams, 'page' | 'page_size'>;

export const MovementsQueryKeys = {
  root: ['movements'] as const,
  recent: (filters: MovementFilters, size: number) =>
    ['movements', 'recent', filters, size] as const,
};

/** Primeros movimientos con filtros, sin paginar (por ejemplo, Gastos recientes de un edificio). */
export const useRecentMovements = (filters: MovementFilters, size: number) =>
  useBaseQuery(
    MovementsQueryKeys.recent(filters, size),
    signal => getMovements({ ...filters, page: 1, page_size: size }, signal),
    QueryStaleTime.operational,
  );
