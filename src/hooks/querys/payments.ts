import {
  getAttentionPayments,
  getContractPaymentsSummary,
  getPayment,
  getPayments,
  type AttentionCategory,
  type PaymentListParams,
} from '@api/payments';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type PaymentFilters = Omit<PaymentListParams, 'page' | 'page_size'>;

export const PaymentsQueryKeys = {
  root: ['payments'] as const,
  attentionRoot: ['payments', 'attention'] as const,
  attention: (category: AttentionCategory, search: string) =>
    [...PaymentsQueryKeys.attentionRoot, category, search] as const,
  list: (filters: PaymentFilters) => ['payments', 'list', filters] as const,
  detail: (paymentId: string) => ['payments', 'detail', paymentId] as const,
  contractSummary: (contractId: string) => ['payments', 'contract-summary', contractId] as const,
};

/** Cobros con filtros (por ejemplo, los vencidos de un inquilino). */
export const usePayments = (filters: PaymentFilters, enabled = true) =>
  useBaseInfiniteQuery(
    PaymentsQueryKeys.list(filters),
    (page, signal) => getPayments({ ...filters, page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
    enabled,
  );

/** Pagos por atender (H-06). `search` ya llega con debounce. */
export const useAttentionPayments = (category: AttentionCategory, search: string) =>
  useBaseInfiniteQuery(
    PaymentsQueryKeys.attention(category, search),
    (page, signal) =>
      getAttentionPayments(
        { category, search: search || undefined, page, page_size: QueryPageSize.standard },
        signal,
      ),
    QueryStaleTime.operational,
  );

/** Y-01 a Y-03: un cobro con su contrato de origen. */
export const usePayment = (paymentId: string | undefined) =>
  useBaseQuery(
    PaymentsQueryKeys.detail(paymentId ?? ''),
    signal => getPayment(paymentId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(paymentId) },
  );

/** Resumen de cobros de un contrato (conteos de chips, Pagos atrasados y Próximo pago). */
export const useContractPaymentsSummary = (contractId: string | undefined) =>
  useBaseQuery(
    PaymentsQueryKeys.contractSummary(contractId ?? ''),
    signal => getContractPaymentsSummary(contractId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(contractId) },
  );
