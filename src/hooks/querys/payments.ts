import {
  getAttentionPayments,
  getContractPaymentsSummary,
  getPayment,
  getManualRentPeriods,
  getPayments,
  cancelPayment,
  correctDepositRefund,
  createAdditionalCharge,
  createManualRent,
  previewAdditionalCharge,
  previewDepositRefundCorrection,
  previewAdditionalChargeUpdate,
  previewManualRent,
  previewReactivate,
  previewReopen,
  reactivatePayment,
  updateAdditionalCharge,
  updateManualRent,
  registerPayment,
  reopenPayment,
  type AttentionCategory,
  type PaymentListParams,
} from '@api/payments';
import { useMutation } from '@tanstack/react-query';
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
  manualRentPeriods: (contractId: string) =>
    ['payments', 'manual-rent-periods', contractId] as const,
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

/** Y-04: registrar el pago completo. Sin reintentos: un error de red no se reenvía solo. */
export const useRegisterPayment = () => useMutation({ retry: false, mutationFn: registerPayment });

/** Y-05: revisión de la corrección (FE-34). */
export const usePreviewReopen = () => useMutation({ retry: false, mutationFn: previewReopen });

/** Y-05: corregir un pago registrado por error. */
export const useReopenPayment = () => useMutation({ retry: false, mutationFn: reopenPayment });

/** Y-06: meses que se pueden agregar (FE-35). Siempre al día: se refresca con cada cambio de cobros. */
export const useManualRentPeriods = (contractId: string | undefined) =>
  useBaseQuery(
    PaymentsQueryKeys.manualRentPeriods(contractId ?? ''),
    signal => getManualRentPeriods(contractId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(contractId) },
  );

/** Y-10: revisión de la reactivación (FE-35). */
export const usePreviewReactivate = () =>
  useMutation({ retry: false, mutationFn: previewReactivate });

/** Y-06: revisión de la renta agregada. */
export const usePreviewManualRent = () =>
  useMutation({ retry: false, mutationFn: previewManualRent });

/** Y-06: agregar la renta con el token de su revisión. */
export const useCreateManualRent = () =>
  useMutation({ retry: false, mutationFn: createManualRent });

/** Y-08: corregir el importe de una renta agregada. */
export const useUpdateManualRent = () =>
  useMutation({ retry: false, mutationFn: updateManualRent });

/** Y-09 / Y-13: cancelar una renta agregada o un cargo sin pagar. */
export const useCancelPayment = () => useMutation({ retry: false, mutationFn: cancelPayment });

/** Y-10: reactivar una renta agregada cancelada. */
export const useReactivatePayment = () =>
  useMutation({ retry: false, mutationFn: reactivatePayment });

/** Y-11: revisión del cargo nuevo (FE-36). */
export const usePreviewAdditionalCharge = () =>
  useMutation({ retry: false, mutationFn: previewAdditionalCharge });

/** Y-12: revisión de la edición del cargo (FE-36). */
export const usePreviewAdditionalChargeUpdate = () =>
  useMutation({ retry: false, mutationFn: previewAdditionalChargeUpdate });

/** Y-11: agregar un cargo adicional. */
export const useCreateAdditionalCharge = () =>
  useMutation({ retry: false, mutationFn: createAdditionalCharge });

/** Y-12: editar un cargo adicional sin pagar. */
export const useUpdateAdditionalCharge = () =>
  useMutation({ retry: false, mutationFn: updateAdditionalCharge });

/** Y-18: revisión de la corrección conjunta (FE-37). */
export const usePreviewDepositRefundCorrection = () =>
  useMutation({ retry: false, mutationFn: previewDepositRefundCorrection });

/** Y-18: corregir juntos el depósito y su devolución. */
export const useCorrectDepositRefund = () =>
  useMutation({ retry: false, mutationFn: correctDepositRefund });
