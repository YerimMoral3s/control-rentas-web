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

/** C-18 / P-10: datos de una renta que ya existe (contrato preexistente). */
export type PreexistingContractInput = {
  unit_id: string;
  tenant_id: string;
  contract_type: ContractType;
  duration_months: number;
  rent_amount: number;
  deposit_required: boolean;
  deposit_amount: number | null;
  start_date: string;
  end_date: string;
  fixed_due_day: number;
};

type PreviewCharge = { amount: string; due_date: string; status: 'pending' | 'overdue' };

/** Revisión del servidor (FR-02): estado, cobros y depósito que se crearán. FRONT no calcula. */
export type CreationPreview = {
  operational_date: string;
  unit: {
    id: string;
    name: string;
    property: { id: string; name: string; property_type: PropertyType };
  };
  tenant: { id: string; first_name: string; last_name: string };
  contract: {
    contract_type: ContractType;
    duration_months: number;
    rent_amount: string;
    start_date: string;
    end_date: string;
    fixed_due_day: number;
    status: ContractStatus;
    is_preexisting: boolean;
  };
  new_rents: Array<PreviewCharge & { period_key: string }>;
  deposit: PreviewCharge | null;
  summary: {
    new_rents: number;
    new_rents_amount: string;
    new_deposits: number;
    new_deposits_amount: string;
    new_payments: number;
    new_payments_amount: string;
  };
  preview_token: string;
};

/** POST /v1/contracts/preexisting/preview — no crea nada. */
export const previewPreexistingContract = (body: PreexistingContractInput) =>
  apiRequest<CreationPreview>({
    method: 'POST',
    url: '/contracts/preexisting/preview',
    data: body,
    operation: 'contract_preexisting_preview',
  });

/** POST /v1/contracts/preexisting — confirma con el token de la revisión (409 PREVIEW_CHANGED si cambió). */
export const createPreexistingContract = (
  body: PreexistingContractInput & { preview_token: string },
) =>
  apiRequest<Contract>({
    method: 'POST',
    url: '/contracts/preexisting',
    data: body,
    operation: 'contract_preexisting_create',
  });

/** C-08: renta nueva. El fin lo calcula BACK; el depósito es obligatorio. */
export type NewContractInput = Omit<PreexistingContractInput, 'end_date'>;

/** Resultado real del alta (C-10): cobros persistidos y resumen. */
export type CreatedContract = Contract & {
  generation_summary: CreationPreview['summary'];
  created_payments: Array<{
    id: string;
    contract_id: string;
    payment_type: string;
    period_key: string;
    amount: string;
    due_date: string;
    status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  }>;
};

/** POST /v1/contracts/preview — no crea nada. */
export const previewContract = (body: NewContractInput) =>
  apiRequest<CreationPreview>({
    method: 'POST',
    url: '/contracts/preview',
    data: body,
    operation: 'contract_preview',
  });

/** POST /v1/contracts — confirma con el token de la revisión (409 PREVIEW_CHANGED si cambió). */
export const createContract = (body: NewContractInput & { preview_token: string }) =>
  apiRequest<CreatedContract>({
    method: 'POST',
    url: '/contracts',
    data: body,
    operation: 'contract_create',
  });

/** C-11: nuevas condiciones formales de la continuidad (inicio = día siguiente al fin anterior). */
export type ContinuationInput = {
  previous_contract_id: string;
  duration_months: number;
  rent_amount: number;
  fixed_due_day: number;
};

/** C-12 / C-14: revisión del servidor de la continuidad (RenewalPreview). FRONT no calcula. */
export type RenewalPreview = {
  previous_contract: { id: string };
  contract: {
    contract_type: 'formal';
    duration_months: number;
    rent_amount: string;
    fixed_due_day: number;
    start_date: string;
    end_date: string;
    status: ContractStatus;
  };
  operational_date: string;
  covered_months: Array<{
    period_key: string;
    payment: {
      id: string;
      origin_contract: { id: string };
      status: 'pending' | 'overdue' | 'paid' | 'cancelled';
      amount: string;
      due_date: string;
      generated_automatically: boolean;
    };
  }>;
  new_rents: Array<{
    period_key: string;
    amount: string;
    due_date: string;
    status: 'pending' | 'overdue';
  }>;
  deposit: ContractDeposit | null;
  summary: {
    total_months: number;
    covered_months: number;
    new_rents: number;
    new_rents_amount: string;
  };
  preview_token: string;
};

/** C-13: contrato nuevo de la continuidad con su resumen real. */
export type RenewedContract = Contract & { renewal_summary: RenewalPreview['summary'] };

/** POST /v1/contracts/formal-continuations/preview — no escribe. */
export const previewContinuation = (body: ContinuationInput) =>
  apiRequest<RenewalPreview>({
    method: 'POST',
    url: '/contracts/formal-continuations/preview',
    data: body,
    operation: 'contract_continuation_preview',
  });

/** POST /v1/contracts/formal-continuations — 409 RENEWAL_PREVIEW_CHANGED si la revisión cambió. */
export const createContinuation = (body: ContinuationInput & { preview_token: string }) =>
  apiRequest<RenewedContract>({
    method: 'POST',
    url: '/contracts/formal-continuations',
    data: body,
    operation: 'contract_continuation_create',
  });

/** C-15: solo renta y día de pago; al menos uno. */
export type ConditionsInput = { rent_amount?: number; fixed_due_day?: number };

type RentState = {
  amount: string;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
};

/** C-16: antes y después, y las rentas existentes que realmente cambiarán (FR-02). */
export type ConditionsPreview = {
  contract_id: string;
  operational_date: string;
  conditions: {
    before: { rent_amount: string; fixed_due_day: number };
    after: { rent_amount: string; fixed_due_day: number };
  };
  changed_rents: Array<{
    id: string;
    contract_id: string;
    period_key: string;
    generated_automatically: boolean;
    before: RentState;
    after: RentState;
  }>;
  summary: { changed_rents: number; amount_before: string; amount_after: string };
  preview_token: string;
};

export type UpdatedContract = Contract & { update_summary: ConditionsPreview['summary'] };

/** POST /v1/contracts/:id/conditions/preview — no modifica nada. */
export const previewConditions = ({
  contractId,
  changes,
}: {
  contractId: string;
  changes: ConditionsInput;
}) =>
  apiRequest<ConditionsPreview>({
    method: 'POST',
    url: `/contracts/${encodeURIComponent(contractId)}/conditions/preview`,
    data: changes,
    operation: 'contract_conditions_preview',
  });

/** PATCH /v1/contracts/:id — confirma con el token (409 PREVIEW_CHANGED si cambió). */
export const updateContract = ({
  contractId,
  changes,
  previewToken,
}: {
  contractId: string;
  changes: ConditionsInput;
  previewToken: string;
}) =>
  apiRequest<UpdatedContract>({
    method: 'PATCH',
    url: `/contracts/${encodeURIComponent(contractId)}`,
    data: { ...changes, preview_token: previewToken },
    operation: 'contract_update',
  });

/** FE-33: lo que se cancela (o se canceló) al terminar y lo que queda pendiente. */
export type TerminationSummary = {
  as_of_date: string;
  is_early: boolean;
  cancelled_rents: Array<{ payment_id: string; period_key: string; amount: string }>;
  cancelled_rents_count: number;
  cancelled_rents_amount: string;
  cancelled_additional_charges: Array<{
    payment_id: string;
    concept: string | null;
    due_date: string;
    amount: string;
  }>;
  cancelled_additional_charges_count: number;
  cancelled_additional_charges_amount: string;
  cancelled_count: number;
  cancelled_amount: string;
  retained_payments: {
    scope: 'rental_continuity';
    unpaid_count: number;
    unpaid_amount: string;
    overdue_count: number;
    overdue_amount: string;
  };
};

export type TerminationPreview = {
  contract: { id: string };
  unit: { id: string };
  termination_summary: TerminationSummary;
  preview_token: string;
};

/** POST /v1/contracts/:id/terminate/preview — no modifica nada (C-17). */
export const previewTermination = (contractId: string) =>
  apiRequest<TerminationPreview>({
    method: 'POST',
    url: `/contracts/${encodeURIComponent(contractId)}/terminate/preview`,
    operation: 'contract_terminate_preview',
  });

/** POST /v1/contracts/:id/terminate — Terminar y desocupar con el token de la revisión (C-17). */
export const terminateContract = ({
  contractId,
  previewToken,
}: {
  contractId: string;
  previewToken: string;
}) =>
  apiRequest<Contract & { termination_summary: TerminationSummary }>({
    method: 'POST',
    url: `/contracts/${encodeURIComponent(contractId)}/terminate`,
    data: { preview_token: previewToken },
    operation: 'contract_terminate',
  });
