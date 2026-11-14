import { apiRequest } from './http';
import type { PropertyType } from './properties';
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
  /** FE-22: el tipo decide cómo se escribe el lugar. */
  property: { id: string; name: string; property_type: PropertyType };
};

/** Depósito de la continuidad: puede venir de un contrato anterior (origin_contract). */
export type ContractDeposit = {
  id: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  amount: string;
  due_date: string;
  paid_at: string | null;
  origin_contract: { id: string };
  /** Única devolución activa, si la hay. */
  refund: { id: string; amount: string; expense_date: string } | null;
  retained_amount: string;
};

/** Modelo Contract completo. */
export type Contract = ContractSummary & {
  deposit: ContractDeposit | null;
  /**
   * FE-24: continuación inmediata (A→B). No garantiza que B siga siendo el contrato actual
   * si después hubo otra continuación (B→C).
   */
  next_contract: { id: string; start_date: string } | null;
  previous_contract_id: string | null;
  vacated_at: string | null;
  duration_months: number;
  fixed_due_day: number;
  is_preexisting: boolean;
  terminated_early_at: string | null;
};

export type ContractListParams = {
  status?: ContractStatus;
  search?: string;
  tenant_id?: string;
  unit_id?: string;
  property_id?: string;
  is_current?: boolean;
  page: number;
  page_size: number;
};

/** FE-23: conteos completos con la búsqueda y filtros aplicados, sin importar el `status` elegido. */
export type ContractListMeta = PaginatedMeta & {
  counts: Record<'all' | ContractStatus, number>;
};

/** GET /v1/contracts — lista paginada con filtros publicados. */
export const getContracts = (params: ContractListParams, signal?: AbortSignal) =>
  apiRequest<Contract[], ContractListMeta>({
    method: 'GET',
    url: '/contracts',
    params,
    signal,
    operation: 'contracts_list',
  });

/** GET /v1/contracts/:id — contrato actual o histórico, con su depósito. */
export const getContract = (contractId: string, signal?: AbortSignal) =>
  apiRequest<Contract>({
    method: 'GET',
    url: `/contracts/${encodeURIComponent(contractId)}`,
    signal,
    operation: 'contract_detail',
  });

/** GET /v1/contracts con scope=dashboard: contratos activos actuales que terminan en los próximos días. */
export const getExpiringContracts = (
  days: number,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
) =>
  apiRequest<ContractSummary[], PaginatedMeta>({
    method: 'GET',
    url: '/contracts',
    params: {
      scope: 'dashboard',
      status: 'active',
      is_current: true,
      expiring_within_days: days,
      /** FE-21: el que vence primero va arriba, en todo el resultado. */
      sort: 'end_date',
      page,
      page_size: pageSize,
    },
    signal,
    operation: 'contracts_expiring',
  });
