import { getDashboardUnits, getUnit, getUnits } from '@api/units';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

export const UnitsQueryKeys = {
  root: ['units'] as const,
  dashboard: (status: 'available' | 'maintenance') => ['units', 'dashboard', status] as const,
  byProperty: (propertyId: string) => ['units', 'list', propertyId] as const,
  detail: (unitId: string) => ['units', 'detail', unitId] as const,
};

/** H-05: unidades disponibles o en mantenimiento (la sección y su hoja comparten la consulta). */
export const useDashboardUnits = (status: 'available' | 'maintenance', enabled: boolean) =>
  useBaseInfiniteQuery(
    UnitsQueryKeys.dashboard(status),
    (page, signal) => getDashboardUnits(status, page, QueryPageSize.standard, signal),
    QueryStaleTime.operational,
    enabled,
  );

/** Unidades de una propiedad (P-03, P-04). */
export const usePropertyUnits = (propertyId: string | undefined) =>
  useBaseInfiniteQuery(
    UnitsQueryKeys.byProperty(propertyId ?? ''),
    (page, signal) =>
      getUnits({ property_id: propertyId ?? '', page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
    Boolean(propertyId),
  );

export const useUnit = (unitId: string | undefined) =>
  useBaseQuery(
    UnitsQueryKeys.detail(unitId ?? ''),
    signal => getUnit(unitId ?? '', signal),
    QueryStaleTime.operational,
    {
      enabled: Boolean(unitId),
    },
  );
