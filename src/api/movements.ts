import type { ExpenseType } from './expenses';
import { apiRequest } from './http';
import type { PaymentType } from './payments';
import type { PropertyType } from './properties';
import type { PaginatedMeta } from './types';

/** Contrato: apis/movements_api_control_rentas.txt */

export type MovementKind = 'income' | 'expense';

export type Movement = {
  /** Origen en Pagos o Gastos; no hay detalle propio de movimiento. */
  source: { type: 'payment' | 'expense'; id: string };
  kind: MovementKind;
  type: PaymentType | ExpenseType;
  /** Con signo: ingreso positivo, gasto negativo. El front no recalcula el signo. */
  amount: string;
  date: string;
  occurred_at: string | null;
  concept: string;
  contract: { id: string } | null;
  tenant: { id: string; first_name: string; last_name: string } | null;
  unit: { id: string; name: string } | null;
  property: { id: string; name: string; property_type: PropertyType } | null;
  /** Ledger: el origen tiene correcciones o anulaciones (marca "Corregido"). */
  has_corrections: boolean;
};

export type MovementsMeta = PaginatedMeta & { counts: Record<'all' | MovementKind, number> };

export type MovementListParams = {
  kind?: 'all' | MovementKind;
  type?: PaymentType | ExpenseType;
  /** Concepto, persona, unidad o propiedad. */
  search?: string;
  /** Fechas civiles inclusivas (ingresos por fecha de pago en México, gastos por su fecha). */
  date_from?: string;
  date_to?: string;
  /** Incluye lo de la propiedad y lo de sus unidades. */
  property_id?: string;
  page: number;
  page_size: number;
};

/** GET /v1/movements — ingresos recibidos y gastos activos en una sola lista. */
export const getMovements = (params: MovementListParams, signal?: AbortSignal) =>
  apiRequest<Movement[], MovementsMeta>({
    method: 'GET',
    url: '/movements',
    params,
    signal,
    operation: 'movements_list',
  });

/** Una versión registrada (posting) de un pago o gasto; nunca una reversa técnica. */
export type FinancialVersion = {
  id: string;
  state: 'current' | 'reversed';
  kind: MovementKind;
  type: PaymentType | ExpenseType;
  /** Con signo, como en Movement. */
  amount: string;
  concept: string;
  date: string;
  occurred_at: string | null;
  recorded_at: string;
  context: {
    contract: { id: string } | null;
    tenant: { id: string; first_name: string; last_name: string } | null;
    unit: { id: string; name: string } | null;
    property: { id: string; name: string; property_type: PropertyType };
    period_key: string | null;
    concept_reference: string | null;
    description: string | null;
  };
};

/** Operación pública del historial; BACK la agrupa y resuelve before/after. */
export type FinancialOperation = {
  id: string;
  type: 'recorded' | 'received_again' | 'corrected' | 'voided';
  recorded_at: string;
  before: FinancialVersion | null;
  after: FinancialVersion | null;
};

export type HistorySourceType = 'payment' | 'expense';

/** M-05: un pago o gasto con correcciones. */
export type HistoryOrigin = {
  source: { type: HistorySourceType; id: string };
  has_corrections: true;
  correction_count: number;
  last_corrected_at: string;
  latest_posting: FinancialVersion;
  /** null: sin resultado vigente (por ejemplo, gasto anulado). */
  current_result: Movement | null;
};

export type HistoryListMeta = PaginatedMeta & {
  counts: Record<'all' | HistorySourceType, number>;
};

/** GET /v1/movements/history — orígenes con correcciones (M-05). */
export const getMovementsHistory = (
  params: {
    source_type?: 'all' | HistorySourceType;
    search?: string;
    page: number;
    page_size: number;
  },
  signal?: AbortSignal,
) =>
  apiRequest<HistoryOrigin[], HistoryListMeta>({
    method: 'GET',
    url: '/movements/history',
    params,
    signal,
    operation: 'movements_history_list',
  });

/** M-06: historial completo de un origen. */
export type SourceHistory = {
  source: { type: HistorySourceType; id: string };
  has_corrections: boolean;
  correction_count: number;
  current_result: Movement | null;
  operations: FinancialOperation[];
};

/** GET /v1/movements/history/:source_type/:source_id — paginado por operaciones completas. */
export const getSourceHistory = (
  sourceType: HistorySourceType,
  sourceId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
) =>
  apiRequest<SourceHistory, PaginatedMeta>({
    method: 'GET',
    url: `/movements/history/${sourceType}/${encodeURIComponent(sourceId)}`,
    params: { page, page_size: pageSize },
    signal,
    operation: 'movements_history_detail',
  });
