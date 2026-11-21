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

/** Respuesta de registrar o corregir: el estado y la fecha del pago guardados por el servidor. */
export type RegisteredPayment = { id: string; status: PaymentStatus; paid_at: string | null };

/** POST /v1/payments/:id/register — pago completo con la fecha y hora del servidor (Y-04). */
export const registerPayment = (paymentId: string) =>
  apiRequest<RegisteredPayment>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/register`,
    operation: 'payment_register',
  });

/** Y-05: cómo quedará el cobro al corregirlo (FE-34). */
export type ReopenPreview = {
  operational_date: string;
  payment: {
    id: string;
    payment_type: PaymentType;
    concept: string;
    amount: string;
    due_date: string;
  };
  before: { status: 'paid'; paid_at: string | null };
  after: { status: 'pending' | 'overdue'; paid_at: null };
  preview_token: string;
};

/** POST /v1/payments/:id/reopen/preview — no modifica nada. */
export const previewReopen = (paymentId: string) =>
  apiRequest<ReopenPreview>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/reopen/preview`,
    operation: 'payment_reopen_preview',
  });

/** POST /v1/payments/:id/reopen — Corregir pago con el token de su revisión (Y-05). */
export const reopenPayment = ({
  paymentId,
  previewToken,
}: {
  paymentId: string;
  previewToken: string;
}) =>
  apiRequest<RegisteredPayment>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/reopen`,
    data: { preview_token: previewToken },
    operation: 'payment_reopen',
  });

/** Y-06: renta agregada después del vencimiento (contrato Vencido que sigue ocupando). */
export type ManualRentInput = {
  contract_id: string;
  period_year: number;
  period_month: number;
  /** Sin importe, el servidor usa la renta del contrato. */
  amount?: number;
};

export type ManualRentPreview = {
  preview_token: string;
  operational_date: string;
  contract: { id: string; rent_amount: string; fixed_due_day: number };
  rent: {
    payment_type: 'monthly_rent';
    period_key: string;
    amount: string;
    due_date: string;
    status: 'pending' | 'overdue';
    generated_automatically: false;
  };
};

/** Y-06: meses que se pueden agregar a un contrato Vencido actual (FE-35). */
export type ManualRentPeriods = {
  operational_date: string;
  contract: { id: string; end_date: string; rent_amount: string; fixed_due_day: number };
  from_period: string;
  to_period: string;
  periods: Array<{
    period_year: number;
    period_month: number;
    period_key: string;
    /** Usar este campo para habilitar el mes (no `existing_rents.length`). */
    can_create: boolean;
    existing_rents: Array<{
      id: string;
      contract: { id: string };
      status: PaymentStatus;
      amount: string;
      due_date: string;
      generated_automatically: boolean;
    }>;
  }>;
};

/** GET /v1/payments/manual-rents/periods?contract_id= */
export const getManualRentPeriods = (contractId: string, signal?: AbortSignal) =>
  apiRequest<ManualRentPeriods>({
    method: 'GET',
    url: '/payments/manual-rents/periods',
    params: { contract_id: contractId },
    signal,
    operation: 'manual_rent_periods',
  });

/** POST /v1/payments/manual-rents/preview — no crea nada. */
export const previewManualRent = (body: ManualRentInput) =>
  apiRequest<ManualRentPreview>({
    method: 'POST',
    url: '/payments/manual-rents/preview',
    data: body,
    operation: 'manual_rent_preview',
  });

/** POST /v1/payments/manual-rents — 201 con el cobro creado (Y-07). */
export const createManualRent = (body: ManualRentInput & { preview_token: string }) =>
  apiRequest<PaymentDetail>({
    method: 'POST',
    url: '/payments/manual-rents',
    data: body,
    operation: 'manual_rent_create',
  });

/** PATCH /v1/payments/:id/manual-rent — solo el importe (Y-08). */
export const updateManualRent = ({ paymentId, amount }: { paymentId: string; amount: number }) =>
  apiRequest<PaymentDetail>({
    method: 'PATCH',
    url: `/payments/${encodeURIComponent(paymentId)}/manual-rent`,
    data: { amount },
    operation: 'manual_rent_update',
  });

/** POST /v1/payments/:id/cancel — renta agregada o cargo sin pagar (Y-09, Y-13). */
export const cancelPayment = (paymentId: string) =>
  apiRequest<PaymentDetail>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/cancel`,
    operation: 'payment_cancel',
  });

/** Y-10: cómo quedará la renta al reactivarla (FE-35). */
export type ReactivatePreview = {
  operational_date: string;
  payment: {
    id: string;
    contract: { id: string };
    payment_type: 'monthly_rent';
    period_key: string;
    amount: string;
    due_date: string;
    generated_automatically: false;
  };
  before: { status: 'cancelled'; canceled_at: string | null };
  after: { status: 'pending' | 'overdue'; canceled_at: null };
  preview_token: string;
};

/** POST /v1/payments/:id/reactivate/preview — no modifica nada. */
export const previewReactivate = (paymentId: string) =>
  apiRequest<ReactivatePreview>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/reactivate/preview`,
    operation: 'payment_reactivate_preview',
  });

/** POST /v1/payments/:id/reactivate — el mismo registro vuelve, con el token (Y-10). */
export const reactivatePayment = ({
  paymentId,
  previewToken,
}: {
  paymentId: string;
  previewToken: string;
}) =>
  apiRequest<PaymentDetail>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/reactivate`,
    data: { preview_token: previewToken },
    operation: 'payment_reactivate',
  });

/** Y-11 / Y-12: cargo adicional del contrato actual Activo. */
export type AdditionalChargeInput = {
  contract_id: string;
  concept_reference: string;
  amount: number;
  due_date: string;
};

/** Respuesta compacta del alta (AdditionalCreated). */
export type AdditionalCreated = {
  id: string;
  contract_id: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  amount: string;
  due_date: string;
  concept_reference: string | null;
};

/** Y-11 / Y-12: cómo quedará el cargo (FE-36). */
export type AdditionalChargeVersion = {
  concept_reference: string | null;
  amount: string;
  due_date: string;
  status: 'pending' | 'overdue';
};

export type AdditionalChargeCreationPreview = {
  operational_date: string;
  contract: { id: string };
  before: null;
  after: AdditionalChargeVersion & { payment_type: 'additional_services' };
  preview_token: string;
};

export type AdditionalChargeUpdatePreview = {
  operational_date: string;
  payment: { id: string; contract: { id: string }; period_key: string };
  before: AdditionalChargeVersion;
  after: AdditionalChargeVersion;
  preview_token: string;
};

export type AdditionalChargeChanges = Partial<Omit<AdditionalChargeInput, 'contract_id'>>;

/** POST /v1/payments/additional-charges/preview — no crea nada. */
export const previewAdditionalCharge = (body: AdditionalChargeInput) =>
  apiRequest<AdditionalChargeCreationPreview>({
    method: 'POST',
    url: '/payments/additional-charges/preview',
    data: body,
    operation: 'additional_charge_preview',
  });

/** POST /v1/payments/additional-charges — 201, con el token de su revisión (Y-11). */
export const createAdditionalCharge = (body: AdditionalChargeInput & { preview_token: string }) =>
  apiRequest<AdditionalCreated>({
    method: 'POST',
    url: '/payments/additional-charges',
    data: body,
    operation: 'additional_charge_create',
  });

/** POST /v1/payments/:id/additional-charge/preview — no modifica nada (Y-12). */
export const previewAdditionalChargeUpdate = ({
  paymentId,
  changes,
}: {
  paymentId: string;
  changes: AdditionalChargeChanges;
}) =>
  apiRequest<AdditionalChargeUpdatePreview>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/additional-charge/preview`,
    data: changes,
    operation: 'additional_charge_update_preview',
  });

/** PATCH /v1/payments/:id/additional-charge — los mismos campos y el token (Y-12). */
export const updateAdditionalCharge = ({
  paymentId,
  changes,
  previewToken,
}: {
  paymentId: string;
  changes: AdditionalChargeChanges;
  previewToken: string;
}) =>
  apiRequest<PaymentDetail>({
    method: 'PATCH',
    url: `/payments/${encodeURIComponent(paymentId)}/additional-charge`,
    data: { ...changes, preview_token: previewToken },
    operation: 'additional_charge_update',
  });

/** Y-18: resultado de corregir juntos el depósito y su devolución. */
export type CorrectedDeposit = {
  deposit: { id: string; status: PaymentStatus; paid_at: string | null };
  refund: { id: string; status: 'inactive'; deactivated_at: string | null };
};

/** Y-18: revisión de la corrección conjunta (FE-37). */
export type DepositRefundCorrectionPreview = {
  operational_date: string;
  deposit: { id: string; contract: { id: string }; amount: string; due_date: string };
  refund: { id: string; amount: string; expense_date: string; status: 'active' };
  before: { status: 'paid'; paid_at: string | null };
  after: { status: 'pending' | 'overdue'; paid_at: null; refund_status: 'inactive' };
  preview_token: string;
};

/** POST /v1/payments/:id/correct-deposit-refund/preview — no modifica nada. */
export const previewDepositRefundCorrection = (paymentId: string) =>
  apiRequest<DepositRefundCorrectionPreview>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/correct-deposit-refund/preview`,
    operation: 'deposit_refund_joint_correction_preview',
  });

/** POST /v1/payments/:id/correct-deposit-refund — cambian los dos registros o ninguno. */
export const correctDepositRefund = ({
  paymentId,
  refundId,
  previewToken,
}: {
  paymentId: string;
  refundId: string;
  previewToken: string;
}) =>
  apiRequest<CorrectedDeposit>({
    method: 'POST',
    url: `/payments/${encodeURIComponent(paymentId)}/correct-deposit-refund`,
    data: { refund_id: refundId, confirm_correction: true, preview_token: previewToken },
    operation: 'deposit_refund_joint_correction',
  });
