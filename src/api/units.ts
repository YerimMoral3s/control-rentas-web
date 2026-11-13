import type { ContractStatus } from './contracts';
import { apiRequest } from './http';
import type { PaginatedMeta } from './types';

/** Contrato: apis/units_api_control_rentas.txt */

export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'inactive';

export type UnitSummary = {
  id: string;
  name: string;
  status: UnitStatus;
  current_contract: { id: string; status: ContractStatus } | null;
  property: { id: string; name: string };
};

/** GET /v1/units con scope=dashboard: unidades revisadas de propiedades completas, por estado. */
export const getDashboardUnits = (
  status: 'available' | 'maintenance',
  pageSize: number,
  signal?: AbortSignal,
) =>
  apiRequest<UnitSummary[], PaginatedMeta>({
    method: 'GET',
    url: '/units',
    params: { scope: 'dashboard', status, page_size: pageSize },
    signal,
    operation: 'units_dashboard',
  });
