import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ContractsQueryKeys } from './contracts';
import { DashboardQueryKeys } from './dashboard';
import { MovementsQueryKeys } from './movements';
import { PaymentsQueryKeys } from './payments';
import { PropertiesQueryKeys } from './properties';
import { TenantsQueryKeys } from './tenants';
import { UnitsQueryKeys } from './units';

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
    tenantCreated: () => invalidate([TenantsQueryKeys.listRoot, TenantsQueryKeys.catalog]),
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
        TenantsQueryKeys.catalog,
        TenantsQueryKeys.detail(tenantId),
        DashboardQueryKeys.root,
      ]),
    /** Propiedad nueva (incompleta): aparece primero en Propiedades. */
    propertyCreated: () => invalidate([PropertiesQueryKeys.root]),
    /** Nombre, ubicación o tipo cambiaron: también se ven en Inicio y en sus unidades. */
    propertyUpdated: (propertyId: string) =>
      invalidate([
        PropertiesQueryKeys.root,
        UnitsQueryKeys.byProperty(propertyId),
        DashboardQueryKeys.root,
      ]),
    /** Unidades nuevas o revisadas: cambia el avance de la configuración de su propiedad. */
    unitsChanged: (propertyId: string) =>
      invalidate([PropertiesQueryKeys.root, UnitsQueryKeys.byProperty(propertyId)]),
    /** Propiedad eliminada: sale de Propiedades, de Inicio y de las búsquedas. */
    propertyDeactivated: () =>
      invalidate([PropertiesQueryKeys.root, UnitsQueryKeys.root, DashboardQueryKeys.root]),
    /**
     * Renta actual guardada (P-10): contrato, cobros y depósito nuevos; la unidad queda Ocupada y
     * el inquilino tiene una ocupación más.
     */
    preexistingContractCreated: (tenantId: string) =>
      invalidate([
        ContractsQueryKeys.root,
        PaymentsQueryKeys.root,
        UnitsQueryKeys.root,
        PropertiesQueryKeys.root,
        TenantsQueryKeys.detail(tenantId),
        TenantsQueryKeys.listRoot,
        TenantsQueryKeys.catalog,
        DashboardQueryKeys.root,
      ]),
    /** Configuración completa: la propiedad y sus unidades entran a Inicio. */
    propertyCompleted: (propertyId: string) =>
      invalidate([
        PropertiesQueryKeys.detail(propertyId),
        PropertiesQueryKeys.root,
        UnitsQueryKeys.root,
        DashboardQueryKeys.root,
      ]),
  };
};
