import { useMutation } from '@tanstack/react-query';
import {
  createUnit,
  createUnitsBulk,
  deactivateUnit,
  getDashboardUnits,
  getUnit,
  getUnits,
  reviewUnit,
  updateUnit,
  type Unit,
} from '@api/units';
import type { ApiSuccess } from '@api/types';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

export const UnitsQueryKeys = {
  root: ['units'] as const,
  dashboard: (status: 'available' | 'maintenance') => ['units', 'dashboard', status] as const,
  byProperty: (propertyId: string) => ['units', 'list', propertyId] as const,
  allOfProperty: (propertyId: string) => ['units', 'list', propertyId, 'all'] as const,
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

/**
 * Configuración (P-07 a P-11): todas las unidades de la propiedad, página por página de 100,
 * para revisar nombres repetidos y pendientes sin depender del scroll.
 */
export const useAllPropertyUnits = (propertyId: string | undefined) =>
  useBaseQuery(
    UnitsQueryKeys.allOfProperty(propertyId ?? ''),
    async (signal): Promise<ApiSuccess<Unit[]>> => {
      const items: Unit[] = [];
      for (let page = 1; ; page += 1) {
        const response = await getUnits(
          { property_id: propertyId ?? '', page, page_size: QueryPageSize.max },
          signal,
        );
        items.push(...response.data);
        if (!response.meta.pagination.has_next) return { data: items, meta: response.meta };
      }
    },
    QueryStaleTime.operational,
    { enabled: Boolean(propertyId) },
  );

/** P-07: la única unidad de casa o bodega. Nunca se reintenta sola. */
export const useCreateUnit = () => useMutation({ retry: false, mutationFn: createUnit });

/** P-08: un grupo de unidades (se crean todas o ninguna). */
export const useCreateUnitsBulk = () => useMutation({ retry: false, mutationFn: createUnitsBulk });

/** P-09: estado de hoy de una unidad durante la configuración. */
export const useReviewUnit = () => useMutation({ retry: false, mutationFn: reviewUnit });

/** U-04 / U-05 / P-15: cambiar nombre o alternar Disponible ↔ En mantenimiento. */
export const useUpdateUnit = () => useMutation({ retry: false, mutationFn: updateUnit });

/** P-15: eliminar unidad (baja lógica). */
export const useDeactivateUnit = () => useMutation({ retry: false, mutationFn: deactivateUnit });
