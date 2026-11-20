import { useMutation } from '@tanstack/react-query';
import {
  createContinuation,
  createContract,
  createPreexistingContract,
  getContract,
  getContracts,
  getExpiringContracts,
  terminateContract,
  updateContract,
  previewConditions,
  previewContinuation,
  previewTermination,
  previewContract,
  previewPreexistingContract,
  type ContractListParams,
} from '@api/contracts';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type ContractFilters = Omit<ContractListParams, 'page' | 'page_size'>;

/** H-04: contratos activos que terminan en los próximos 30 días. */
const EXPIRING_DAYS = 30;

export const ContractsQueryKeys = {
  root: ['contracts'] as const,
  expiring: ['contracts', 'expiring', EXPIRING_DAYS] as const,
  list: (filters: ContractFilters) => ['contracts', 'list', filters] as const,
  detail: (contractId: string) => ['contracts', 'detail', contractId] as const,
};

/** Contratos con filtros (por ejemplo, ocupaciones actuales o historial de un inquilino). */
export const useContracts = (
  filters: ContractFilters,
  enabled = true,
  pageSize: number = QueryPageSize.standard,
) =>
  useBaseInfiniteQuery(
    [...ContractsQueryKeys.list(filters), pageSize],
    (page, signal) => getContracts({ ...filters, page, page_size: pageSize }, signal),
    QueryStaleTime.operational,
    enabled,
  );

/** H-04: contratos por vencer con scroll infinito (la sección y su hoja comparten la consulta). */
export const useExpiringContracts = (enabled: boolean) =>
  useBaseInfiniteQuery(
    ContractsQueryKeys.expiring,
    (page, signal) => getExpiringContracts(EXPIRING_DAYS, page, QueryPageSize.standard, signal),
    QueryStaleTime.operational,
    enabled,
  );

/** C-03 a C-06: un contrato con su depósito. */
export const useContract = (contractId: string | undefined) =>
  useBaseQuery(
    ContractsQueryKeys.detail(contractId ?? ''),
    signal => getContract(contractId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(contractId) },
  );

/** P-10 / C-18: revisión del servidor (no crea nada). Nunca se reintenta sola. */
export const usePreviewPreexistingContract = () =>
  useMutation({ retry: false, mutationFn: previewPreexistingContract });

/** P-10 / C-18: guardar la renta actual con el token de su revisión. */
export const useCreatePreexistingContract = () =>
  useMutation({ retry: false, mutationFn: createPreexistingContract });

/** C-09: revisión del servidor de una renta nueva. */
export const usePreviewContract = () => useMutation({ retry: false, mutationFn: previewContract });

/** C-09: crear el contrato con el token de su revisión. */
export const useCreateContract = () => useMutation({ retry: false, mutationFn: createContract });

/** C-12: revisión de la continuidad. */
export const usePreviewContinuation = () =>
  useMutation({ retry: false, mutationFn: previewContinuation });

/** C-12 / C-14: confirmar la continuidad con el token de su revisión. */
export const useCreateContinuation = () =>
  useMutation({ retry: false, mutationFn: createContinuation });

/** C-16: rentas que cambiarán con la nueva renta o día de pago. */
export const usePreviewConditions = () =>
  useMutation({ retry: false, mutationFn: previewConditions });

/** C-16: guardar los cambios con el token de su revisión. */
export const useUpdateContract = () => useMutation({ retry: false, mutationFn: updateContract });

/** C-17: qué se cancelaría al terminar (FE-33). */
export const usePreviewTermination = () =>
  useMutation({ retry: false, mutationFn: previewTermination });

/** C-17: Terminar y desocupar. */
export const useTerminateContract = () =>
  useMutation({ retry: false, mutationFn: terminateContract });
