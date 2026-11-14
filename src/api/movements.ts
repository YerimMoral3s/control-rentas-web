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
