import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ContractsQueryKeys } from './contracts';
import { DashboardQueryKeys } from './dashboard';
import { MovementsQueryKeys } from './movements';
import { PaymentsQueryKeys } from './payments';
import { TenantsQueryKeys } from './tenants';

/**
 * Un evento por acción de dominio (patrón appv2). Cada uno invalida solo las consultas que esa
 * acción puede cambiar; nunca toda la caché.
 */
export const useInvalidateEvents = () => {
  const queryClient = useQueryClient();
  const invalidate = (queryKeys: QueryKey[]) =>
    Promise.all(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey })));

  return {
    /** Inquilino nuevo: aparece en la lista y en búsquedas. */
    tenantCreated: () => invalidate([TenantsQueryKeys.listRoot]),
    /** Nombre o teléfono cambiaron: se muestran también en contratos, cobros y movimientos. */
    tenantUpdated: (tenantId: string) =>
      invalidate([
        TenantsQueryKeys.root,
        TenantsQueryKeys.detail(tenantId),
        ContractsQueryKeys.root,
        PaymentsQueryKeys.root,
        MovementsQueryKeys.root,
      ]),
    /** Baja lógica: sale de la lista. Sus contratos y cobros se conservan. */
    tenantDeactivated: (tenantId: string) =>
      invalidate([
        TenantsQueryKeys.listRoot,
        TenantsQueryKeys.detail(tenantId),
        DashboardQueryKeys.root,
      ]),
  };
};
