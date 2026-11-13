import { getTenant, getTenants } from '@api/tenants';
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
      getTenants({ search: search || undefined, page, page_size: QueryPageSize.standard }, signal),
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
