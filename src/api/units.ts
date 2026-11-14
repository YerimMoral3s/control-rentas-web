import type { ContractStatus } from './contracts';
import type { PropertyType } from './properties';
import { apiRequest } from './http';
import type { PaginatedMeta } from './types';

/** Contrato: apis/units_api_control_rentas.txt */

export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'inactive';

export type UnitType = 'apartment' | 'commercial_space' | 'full_house' | 'warehouse';

export type UnitSummary = {
  id: string;
  name: string;
  status: UnitStatus;
  current_contract: { id: string; status: ContractStatus } | null;
  /** FE-30: el tipo permite mostrar casa y bodega solo con el nombre de la propiedad. */
  property: { id: string; name: string; property_type: PropertyType };
};

/** GET /v1/units con scope=dashboard: unidades revisadas de propiedades completas, por estado. */
export const getDashboardUnits = (
  status: 'available' | 'maintenance',
  page: number,
  pageSize: number,
  signal?: AbortSignal,
) =>
  apiRequest<UnitSummary[], PaginatedMeta>({
    method: 'GET',
    url: '/units',
    params: { scope: 'dashboard', status, page, page_size: pageSize },
    signal,
    operation: 'units_dashboard',
  });

/** Modelo Unit completo. */
export type Unit = UnitSummary & {
  unit_type: UnitType;
  /** null: unidad recién creada que aún no se revisa. */
  reviewed_at: string | null;
  base_rent_amount: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type UnitListParams = {
  property_id?: string;
  page: number;
  page_size: number;
};

/** GET /v1/units — unidades no inactivas (incluye las no revisadas). */
export const getUnits = (params: UnitListParams, signal?: AbortSignal) =>
  apiRequest<Unit[], PaginatedMeta>({
    method: 'GET',
    url: '/units',
    params,
    signal,
    operation: 'units_list',
  });

/** GET /v1/units/:id */
export const getUnit = (unitId: string, signal?: AbortSignal) =>
  apiRequest<Unit>({
    method: 'GET',
    url: `/units/${encodeURIComponent(unitId)}`,
    signal,
    operation: 'unit_detail',
  });

/** POST /v1/units — una unidad (casa o bodega: su única unidad). Queda sin revisar. */
export const createUnit = (body: { property_id: string; name: string; unit_type: UnitType }) =>
  apiRequest<Unit>({ method: 'POST', url: '/units', data: body, operation: 'unit_create' });

type UnitBlock = {
  unit_type: UnitType;
  quantity: number;
  /** Debe contener {n}; se reemplaza por el número de cada unidad. */
  naming_pattern: string;
  start_at: number;
};

/** POST /v1/units/bulk — crea el grupo completo o ninguna (operación atómica). */
export const createUnitsBulk = (body: { property_id: string; blocks: UnitBlock[] }) =>
  apiRequest<{ created_count: number; items: Unit[] }>({
    method: 'POST',
    url: '/units/bulk',
    data: body,
    operation: 'units_bulk_create',
  });

/** POST /v1/units/:id/review — estado de hoy durante la configuración. */
export const reviewUnit = ({
  unitId,
  status,
}: {
  unitId: string;
  status: 'available' | 'maintenance' | 'occupied';
}) =>
  apiRequest<Unit>({
    method: 'POST',
    url: `/units/${encodeURIComponent(unitId)}/review`,
    data: { status },
    operation: 'unit_review',
  });

/** PATCH /v1/units/:id — nombre o Disponible ↔ En mantenimiento (U-04, U-05, P-15). */
export const updateUnit = ({
  unitId,
  changes,
}: {
  unitId: string;
  changes: { name?: string; status?: 'available' | 'maintenance' };
}) =>
  apiRequest<Unit>({
    method: 'PATCH',
    url: `/units/${encodeURIComponent(unitId)}`,
    data: changes,
    operation: 'unit_update',
  });

/** PATCH /v1/units/:id/deactivate — eliminar unidad (baja lógica); bloqueada si alguien la renta. */
export const deactivateUnit = (unitId: string) =>
  apiRequest<{ id: string; status: 'inactive'; deactivated_at: string | null }>({
    method: 'PATCH',
    url: `/units/${encodeURIComponent(unitId)}/deactivate`,
    operation: 'unit_deactivate',
  });
