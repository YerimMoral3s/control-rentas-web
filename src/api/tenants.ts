import type { ContractStatus } from './contracts';
import { apiRequest } from './http';
import type { PaginatedMeta } from './types';

/** Contrato: apis/tenants_api_control_rentas.txt */

export type TenantStatus = 'active' | 'inactive';

type UnitRef = { id: string; name: string; property: { id: string; name: string } };

export type OverdueDebt = {
  as_of_date: string;
  amount: string;
  payment_count: number;
  /** Parte del total que viene de contratos que ya no son ocupación actual (ya incluida en amount). */
  historical_amount: string;
  by_unit: Array<{
    unit: UnitRef;
    amount: string;
    payment_count: number;
    contracts: Array<{
      contract: { id: string; status: ContractStatus; is_current: boolean };
      amount: string;
      payment_count: number;
    }>;
  }>;
};

export type Tenant = {
  id: string;
  first_name: string;
  last_name: string;
  alias: string | null;
  phone: string;
  secondary_phone: string | null;
  notes: string | null;
  status: TenantStatus;
  /** Todas las ocupaciones actuales, sin limitar por página. */
  current_contracts: Array<{ id: string; status: ContractStatus; unit: UnitRef }>;
  overdue_debt: OverdueDebt;
  created_at: string;
  updated_at: string;
};

type TenantListParams = {
  search?: string;
  page: number;
  page_size: number;
};

/** GET /v1/tenants — inquilinos activos; busca por alias, nombre, apellidos y teléfonos. */
export const getTenants = ({ search, ...params }: TenantListParams, signal?: AbortSignal) =>
  apiRequest<Tenant[], PaginatedMeta>({
    method: 'GET',
    url: '/tenants',
    params: { ...params, ...(search ? { search } : {}) },
    signal,
    operation: 'tenants_list',
  });

/** GET /v1/tenants/:id — contacto, ocupaciones actuales y adeudo completo. */
export const getTenant = (tenantId: string, signal?: AbortSignal) =>
  apiRequest<Tenant>({
    method: 'GET',
    url: `/tenants/${encodeURIComponent(tenantId)}`,
    signal,
    operation: 'tenant_detail',
  });
