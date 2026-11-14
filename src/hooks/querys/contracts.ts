import {
  getContract,
  getContracts,
  getExpiringContracts,
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
