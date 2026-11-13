import { getContracts, getExpiringContracts, type ContractListParams } from '@api/contracts';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

type ContractFilters = Omit<ContractListParams, 'page' | 'page_size'>;

/** H-04: contratos activos que terminan en los próximos 30 días. */
const EXPIRING_DAYS = 30;
const EXPIRING_PREVIEW_SIZE = 10;

export const ContractsQueryKeys = {
  root: ['contracts'] as const,
  expiring: ['contracts', 'expiring', EXPIRING_DAYS] as const,
  list: (filters: ContractFilters) => ['contracts', 'list', filters] as const,
};

/** Contratos con filtros (por ejemplo, ocupaciones actuales o historial de un inquilino). */
export const useContracts = (filters: ContractFilters, enabled = true) =>
  useBaseInfiniteQuery(
    ContractsQueryKeys.list(filters),
    (page, signal) => getContracts({ ...filters, page, page_size: QueryPageSize.standard }, signal),
    QueryStaleTime.operational,
    enabled,
  );

export const useExpiringContracts = (enabled: boolean) =>
  useBaseQuery(
    ContractsQueryKeys.expiring,
    signal => getExpiringContracts(EXPIRING_DAYS, EXPIRING_PREVIEW_SIZE, signal),
    QueryStaleTime.operational,
    { enabled },
  );
