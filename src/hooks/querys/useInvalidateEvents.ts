import { useMemo } from 'react';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { ContractsQueryKeys } from './contracts';
import { DashboardQueryKeys } from './dashboard';
import { ExpensesQueryKeys } from './expenses';
import { MovementsQueryKeys } from './movements';
import { PaymentsQueryKeys } from './payments';
import { PropertiesQueryKeys } from './properties';
import { TenantsQueryKeys } from './tenants';
import { UnitsQueryKeys } from './units';

/**
 * Un evento por acción de dominio (patrón appv2). Cada uno invalida solo las consultas que esa
 * acción puede cambiar; nunca toda la caché.
 */
const buildEvents = (queryClient: QueryClient) => {
  const invalidate = (queryKeys: QueryKey[]) =>
    Promise.all(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey })));

  return {
    /** Inquilino nuevo: aparece en la lista y en búsquedas. */
    tenantCreated: () => invalidate([TenantsQueryKeys.catalog]),
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
        TenantsQueryKeys.catalog,
        TenantsQueryKeys.detail(tenantId),
        DashboardQueryKeys.root,
      ]),
    /**
     * Y-04 / Y-05: un cobro se pagó o se corrigió. Cambian el cobro, Pagos por atender, el resumen
     * del contrato, los pagos atrasados del inquilino, Inicio y Movimientos.
     */
    paymentChanged: () =>
      invalidate([
        PaymentsQueryKeys.root,
        ContractsQueryKeys.root,
        TenantsQueryKeys.root,
        DashboardQueryKeys.root,
        MovementsQueryKeys.root,
      ]),
    /**
     * Y-16 a Y-18: devolución de depósito registrada, corregida o eliminada. Cambian el depósito, el
     * contrato, los gastos de la unidad, Movimientos, Inicio y el adeudo del inquilino.
     */
    depositRefundChanged: () =>
      invalidate([
        PaymentsQueryKeys.root,
        ContractsQueryKeys.root,
        ExpensesQueryKeys.root,
        MovementsQueryKeys.root,
        DashboardQueryKeys.root,
        TenantsQueryKeys.root,
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
     * Contrato nuevo (C-09), continuidad (C-13) o renta actual guardada (P-10): contrato, cobros y depósito nuevos; la
     * unidad queda Ocupada y el inquilino tiene una ocupación más.
     */
    contractCreated: (tenantId: string) =>
      invalidate([
        ContractsQueryKeys.root,
        PaymentsQueryKeys.root,
        UnitsQueryKeys.root,
        PropertiesQueryKeys.root,
        TenantsQueryKeys.detail(tenantId),
        TenantsQueryKeys.catalog,
        DashboardQueryKeys.root,
      ]),
    /**
     * Unidad editada, enviada a mantenimiento, disponible o eliminada: cambia su detalle, la
     * propiedad (conteos, avance) e Inicio (disponibles y en mantenimiento).
     */
    unitChanged: () =>
      invalidate([UnitsQueryKeys.root, PropertiesQueryKeys.root, DashboardQueryKeys.root]),
    /** Nombre de unidad o propiedad corregido (P-15): se muestra en contratos, cobros e inquilinos. */
    placeRenamed: () =>
      invalidate([
        UnitsQueryKeys.root,
        PropertiesQueryKeys.root,
        DashboardQueryKeys.root,
        ContractsQueryKeys.root,
        PaymentsQueryKeys.root,
        MovementsQueryKeys.root,
        TenantsQueryKeys.root,
      ]),
    /** C-16: renta o día de pago cambiados: el contrato, sus cobros, Inicio y el adeudo. */
    contractUpdated: () =>
      invalidate([
        ContractsQueryKeys.root,
        PaymentsQueryKeys.root,
        TenantsQueryKeys.root,
        DashboardQueryKeys.root,
      ]),
    /** C-17: contrato Terminado, unidad Disponible y rentas futuras Canceladas. */
    contractTerminated: () =>
      invalidate([
        ContractsQueryKeys.root,
        PaymentsQueryKeys.root,
        UnitsQueryKeys.root,
        PropertiesQueryKeys.root,
        TenantsQueryKeys.root,
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

/** Mismo objeto mientras no cambie el queryClient: se puede usar en dependencias de efectos. */
export const useInvalidateEvents = () => {
  const queryClient = useQueryClient();
  return useMemo(() => buildEvents(queryClient), [queryClient]);
};
