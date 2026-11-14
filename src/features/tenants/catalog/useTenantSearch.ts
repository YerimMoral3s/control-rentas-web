import { useMemo } from 'react';
import type { Tenant } from '@api/tenants';
import { useTenantsCatalog } from '@hooks/querys/tenants';
import { buildTenantIndex, searchTenantIds } from './tenantSearch';

/**
 * Busca en el catálogo de inquilinos (una sola descarga para toda la app). El índice se rehace
 * cuando cambia el catálogo, también después de invalidarlo.
 * - `byName`: resultados en el orden del catálogo (por nombre), como la lista de Inquilinos.
 * - sin `byName`: por relevancia, para selectores.
 */
export const useTenantSearch = (term: string, { byName = false } = {}) => {
  const catalog = useTenantsCatalog();
  const tenants = useMemo(() => catalog.data?.data ?? [], [catalog.data]);
  const index = useMemo(() => buildTenantIndex(tenants), [tenants]);
  const results = useMemo<Tenant[]>(() => {
    if (!term.trim()) return tenants;
    const ids = searchTenantIds(index, term);
    if (byName) {
      const found = new Set(ids);
      return tenants.filter(tenant => found.has(tenant.id));
    }
    const byId = new Map(tenants.map(tenant => [tenant.id, tenant]));
    return ids.map(id => byId.get(id)).filter((tenant): tenant is Tenant => Boolean(tenant));
  }, [byName, index, tenants, term]);
  return { catalog, results };
};
