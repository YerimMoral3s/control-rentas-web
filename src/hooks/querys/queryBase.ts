import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { AppError } from '@api/errors';
import type { ApiMeta, ApiSuccess, PaginatedMeta } from '@api/types';

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
  infinite: 15 * 60 * 1000,
} as const;

export const QueryPageSize = {
  standard: 20,
  /** Máximo de la API; para relaciones que se cruzan con otra lista (p. ej. inquilino de cada unidad). */
  max: 100,
} as const;

/** Igual que appv2: se conservan pocas páginas para no crecer sin límite. */
export const InfiniteQueryPolicy = {
  maxPages: 10,
} as const;

const defaultItemKey = (item: unknown) => (item as { id: string }).id;

/** Une las páginas sin repetir registros (uno puede cambiar de página entre consultas). */
export const flattenUniqueById = <T>(
  pages: ReadonlyArray<ReadonlyArray<T> | null | undefined>,
  getKey: (item: T) => string = defaultItemKey,
): T[] => {
  const byId = new Map<string, T>();
  for (const page of pages) for (const item of page ?? []) byId.set(getKey(item), item);
  return Array.from(byId.values());
};

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

type InfiniteRequest<TItem, TMeta extends PaginatedMeta> = (
  page: number,
  signal: AbortSignal,
) => Promise<ApiSuccess<TItem[], TMeta>>;

/**
 * Lista paginada con scroll infinito. Al cambiar la query key (filtro o búsqueda) se vuelve a la
 * página 1 y se conserva la lista anterior mientras carga. `meta` es la de la primera página:
 * los conteos y totales vienen completos del servidor, nunca se suman páginas.
 */
export const useBaseInfiniteQuery = <
  TItem,
  TMeta extends PaginatedMeta,
  TKey extends readonly unknown[],
>(
  queryKey: TKey,
  request: InfiniteRequest<TItem, TMeta>,
  staleTime: number,
  enabled = true,
  /** Clave única de cada registro; por defecto su `id`. */
  getKey?: (item: TItem) => string,
) => {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => request(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: last =>
      last.meta.pagination.has_next ? last.meta.pagination.page + 1 : undefined,
    maxPages: InfiniteQueryPolicy.maxPages,
    staleTime,
    gcTime: QueryGcTime.infinite,
    placeholderData: keepPreviousData,
    enabled,
  });

  const pages = query.data?.pages;
  return {
    ...query,
    items: flattenUniqueById<TItem>(pages?.map(page => page.data) ?? [], getKey),
    meta: pages?.[0]?.meta,
  };
};
