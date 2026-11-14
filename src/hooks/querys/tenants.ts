import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AppError } from '@api/errors';
import {
  createTenant,
  deactivateTenant,
  getTenant,
  getTenants,
  updateTenant,
  type Tenant,
  type TenantInput,
} from '@api/tenants';
import type { ApiSuccess } from '@api/types';
import { QueryPageSize, QueryStaleTime, useBaseQuery } from './queryBase';

export const TenantsQueryKeys = {
  root: ['tenants'] as const,
  detail: (tenantId: string) => ['tenants', 'detail', tenantId] as const,
  /** Catálogo completo: lista de Inquilinos (T-01) y selectores, con búsqueda MiniSearch. */
  catalog: ['tenants', 'catalog'] as const,
};

/** T-02 / T-03: un inquilino con sus ocupaciones y adeudo completo. */
export const useTenant = (tenantId: string | undefined) =>
  useBaseQuery(
    TenantsQueryKeys.detail(tenantId ?? ''),
    signal => getTenant(tenantId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(tenantId) },
  );

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<ApiSuccess<TData>, AppError, TVariables>,
  'mutationFn'
>;

/** T-06: crear inquilino. Nunca se reintenta solo. */
export const useCreateTenant = (options?: MutationOptions<Tenant, TenantInput>) =>
  useMutation({ ...options, retry: false, mutationFn: createTenant });

/** T-08: editar inquilino. */
export const useUpdateTenant = (
  options?: MutationOptions<Tenant, { tenantId: string; changes: Partial<TenantInput> }>,
) => useMutation({ ...options, retry: false, mutationFn: updateTenant });

/** T-09: eliminar inquilino (baja lógica). */
export const useDeactivateTenant = (
  options?: MutationOptions<
    { id: string; status: 'inactive'; deactivated_at: string | null },
    string
  >,
) => useMutation({ ...options, retry: false, mutationFn: deactivateTenant });

/**
 * Catálogo de inquilinos activos (acuerdo del 14 nov.): todas las páginas de 100, por nombre, una
 * sola vez para la lista de Inquilinos y los selectores. Vigencia operativa (30 s): al abrir una
 * pantalla que lo usa y ya pasó ese tiempo se pide de nuevo; tras cada acción se invalida.
 */
export const useTenantsCatalog = () =>
  useBaseQuery(
    TenantsQueryKeys.catalog,
    async (signal): Promise<ApiSuccess<Tenant[]>> => {
      const items: Tenant[] = [];
      for (let page = 1; ; page += 1) {
        const response = await getTenants(
          { sort: 'name', page, page_size: QueryPageSize.max },
          signal,
        );
        items.push(...response.data);
        if (!response.meta.pagination.has_next) return { data: items, meta: response.meta };
      }
    },
    QueryStaleTime.operational,
  );
