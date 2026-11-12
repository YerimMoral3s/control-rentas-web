import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AppError } from '@api/errors';
import type { ApiMeta, ApiSuccess } from '@api/types';

export type BaseQueryOptions<TData> = Omit<
  UseQueryOptions<TData, AppError, TData>,
  'queryKey' | 'queryFn' | 'staleTime' | 'gcTime'
>;

type BaseQueryRequest<TData, TMeta extends ApiMeta> = (
  signal: AbortSignal,
) => Promise<ApiSuccess<TData, TMeta>>;

/** Datos financieros cambian seguido: vigencias cortas y siempre se invalidan tras una acción. */
export const QueryStaleTime = {
  operational: 30 * 1000,
  standard: 5 * 60 * 1000,
  stable: 30 * 60 * 1000,
} as const;

export const QueryGcTime = {
  standard: 30 * 60 * 1000,
} as const;

/** Igual que appv2: la query entrega la envoltura completa para conservar meta (paginación, conteos). */
export const useBaseQuery = <TData, TMeta extends ApiMeta, TKey extends readonly unknown[]>(
  queryKey: TKey,
  request: BaseQueryRequest<TData, TMeta>,
  staleTime: number,
  options?: BaseQueryOptions<ApiSuccess<TData, TMeta>>,
) =>
  useQuery({
    queryKey,
    queryFn: ({ signal }) => request(signal),
    staleTime,
    gcTime: QueryGcTime.standard,
    ...options,
  });
