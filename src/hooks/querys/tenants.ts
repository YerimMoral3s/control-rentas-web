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
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

export const TenantsQueryKeys = {
  root: ['tenants'] as const,
  listRoot: ['tenants', 'list'] as const,
  list: (search: string) => [...TenantsQueryKeys.listRoot, search] as const,
  detail: (tenantId: string) => ['tenants', 'detail', tenantId] as const,
};

/** T-01: lista de inquilinos activos. `search` ya llega con debounce. */
export const useTenants = (search: string) =>
  useBaseInfiniteQuery(
    TenantsQueryKeys.list(search),
    (page, signal) =>
      getTenants(
        { search: search || undefined, sort: 'name', page, page_size: QueryPageSize.standard },
        signal,
      ),
    QueryStaleTime.operational,
  );

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
