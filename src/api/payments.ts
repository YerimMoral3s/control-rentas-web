import { apiRequest } from './http';
import type { ContractStatus, ContractType } from './contracts';
import type { PropertyType } from './properties';
import type { PaginatedMeta } from './types';

/** Contrato: apis/payments_api_control_rentas.txt */

export type PaymentType = 'monthly_rent' | 'deposit' | 'additional_services';
export type PaymentStatus = 'pending' | 'overdue' | 'paid' | 'cancelled';

export type Payment = {
  id: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  period_year: number | null;
  period_month: number | null;
  period_key: string;
  amount: string;
  due_date: string;
  paid_at: string | null;
  canceled_at: string | null;
  concept_reference: string | null;
  generated_automatically: boolean;
  contract: { id: string; status: ContractStatus; contract_type: ContractType };
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
  created_at: string;
  updated_at: string;
};

export type AttentionCategory = 'all' | 'overdue' | 'upcoming' | 'rest_of_month';

export type AttentionMeta = PaginatedMeta & {
  /** Fecha operativa del servidor (America/Mexico_City). */
  as_of_date: string;
  attention_counts: Record<AttentionCategory, number>;
};

export type AttentionParams = {
  category: AttentionCategory;
  search?: string;
  page: number;
  page_size: number;
};

/** GET /v1/payments/attention — Pagos por atender de Inicio, con conteos completos. */
export const getAttentionPayments = (
  { search, ...params }: AttentionParams,
  signal?: AbortSignal,
) =>
  apiRequest<Payment[], AttentionMeta>({
    method: 'GET',
    url: '/payments/attention',
    params: { ...params, ...(search ? { search } : {}) },
    signal,
    operation: 'payments_attention',
  });

export type PaymentListParams = {
  status?: PaymentStatus | 'all' | 'unpaid';
  /** Incluye rentas válidas de contratos anteriores que cubren meses de su vigencia. */
  tenant_id?: string;
  contract_id?: string;
  unit_id?: string;
  page: number;
  page_size: number;
};

/** GET /v1/payments — cobros con filtros publicados (sin status: Pendientes y Vencidos). */
export const getPayments = (params: PaymentListParams, signal?: AbortSignal) =>
  apiRequest<Payment[], PaginatedMeta>({
    method: 'GET',
    url: '/payments',
    params,
    signal,
    operation: 'payments_list',
  });

/** Detalle de un cobro: el contrato de origen trae sus fechas. */
export type PaymentDetail = Omit<Payment, 'contract'> & {
  contract: Payment['contract'] & { start_date: string; end_date: string };
};

/** GET /v1/payments/:id */
export const getPayment = (paymentId: string, signal?: AbortSignal) =>
  apiRequest<PaymentDetail>({
    method: 'GET',
    url: `/payments/${encodeURIComponent(paymentId)}`,
    signal,
    operation: 'payment_detail',
  });

/** Resumen de cobros de un contrato: conteos, adeudo y próximo pago sobre el conjunto completo. */
export type ContractPaymentsSummary = {
  contract: { id: string };
  as_of_date: string;
  counts: { all: number; unpaid: number; paid: number; cancelled: number };
  overdue_debt: { amount: string; payment_count: number };
  /** Primer impago que vence hoy o después; null no significa que no haya atrasos. */
  next_payment: Payment | null;
};

/** GET /v1/payments/contract-summary?contract_id= */
export const getContractPaymentsSummary = (contractId: string, signal?: AbortSignal) =>
  apiRequest<ContractPaymentsSummary>({
    method: 'GET',
    url: '/payments/contract-summary',
    params: { contract_id: contractId },
    signal,
    operation: 'contract_payments_summary',
  });
