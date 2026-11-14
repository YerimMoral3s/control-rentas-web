import { useMutation } from '@tanstack/react-query';
import {
  completePropertyConfiguration,
  createProperty,
  deactivateProperty,
  getProperties,
  getProperty,
  updateProperty,
  type Property,
} from '@api/properties';
import { QueryPageSize, QueryStaleTime, useBaseInfiniteQuery, useBaseQuery } from './queryBase';

export const PropertiesQueryKeys = {
  root: ['properties'] as const,
  list: (status: Property['configuration_status'], search: string) =>
    ['properties', 'list', status, search] as const,
  detail: (propertyId: string) => ['properties', 'detail', propertyId] as const,
};

/** P-01: una lista por estado de configuración (las incompletas se muestran primero). */
export const useProperties = (status: Property['configuration_status'], search: string) =>
  useBaseInfiniteQuery(
    PropertiesQueryKeys.list(status, search),
    (page, signal) =>
      getProperties(
        {
          configuration_status: status,
          search: search || undefined,
          page,
          page_size: QueryPageSize.standard,
        },
        signal,
      ),
    QueryStaleTime.operational,
  );

export const useProperty = (propertyId: string | undefined) =>
  useBaseQuery(
    PropertiesQueryKeys.detail(propertyId ?? ''),
    signal => getProperty(propertyId ?? '', signal),
    QueryStaleTime.operational,
    { enabled: Boolean(propertyId) },
  );

/** P-05 / P-06: crear la propiedad (queda incompleta). Nunca se reintenta solo. */
export const useCreateProperty = () => useMutation({ retry: false, mutationFn: createProperty });

/** P-06: corregir datos o tipo durante la configuración. */
export const useUpdateProperty = () => useMutation({ retry: false, mutationFn: updateProperty });

/** P-11: completar configuración; desde aquí aparece en Inicio. */
export const useCompletePropertyConfiguration = () =>
  useMutation({ retry: false, mutationFn: completePropertyConfiguration });

/** Eliminar propiedad (baja lógica, P-15). */
export const useDeactivateProperty = () =>
  useMutation({ retry: false, mutationFn: deactivateProperty });
