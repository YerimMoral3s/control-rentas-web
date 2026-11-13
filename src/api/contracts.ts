import { apiRequest } from './http';
import type { PaginatedMeta } from './types';

/** Contrato: apis/contracts_api_control_rentas.txt */

export type ContractStatus = 'active' | 'expired' | 'terminated';
export type ContractType = 'trial' | 'formal';

/** Campos del listado que usa la interfaz hasta ahora (modelo Contract). */
export type ContractSummary = {
  id: string;
  contract_type: ContractType;
  status: ContractStatus;
  is_current: boolean;
  start_date: string;
  end_date: string;
  rent_amount: string;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    alias: string | null;
    phone: string;
  };
  unit: { id: string; name: string };
  property: { id: string; name: string };
};

/** Modelo Contract completo (campos de consulta; el depósito se agrega con Contratos). */
export type Contract = ContractSummary & {
  previous_contract_id: string | null;
  vacated_at: string | null;
  duration_months: number;
  fixed_due_day: number;
  is_preexisting: boolean;
  terminated_early_at: string | null;
};

export type ContractListParams = {
  tenant_id?: string;
  unit_id?: string;
  property_id?: string;
  is_current?: boolean;
  page: number;
  page_size: number;
};

/** GET /v1/contracts — lista paginada con filtros publicados. */
export const getContracts = (params: ContractListParams, signal?: AbortSignal) =>
  apiRequest<Contract[], PaginatedMeta>({
    method: 'GET',
    url: '/contracts',
    params,
    signal,
    operation: 'contracts_list',
  });

/** GET /v1/contracts con scope=dashboard: contratos activos actuales que terminan en los próximos días. */
export const getExpiringContracts = (days: number, pageSize: number, signal?: AbortSignal) =>
  apiRequest<ContractSummary[], PaginatedMeta>({
    method: 'GET',
    url: '/contracts',
    params: {
      scope: 'dashboard',
      status: 'active',
      expiring_within_days: days,
      page_size: pageSize,
    },
    signal,
    operation: 'contracts_expiring',
  });
