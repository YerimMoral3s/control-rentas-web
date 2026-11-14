import { apiRequest } from './http';
import type { UnitStatus } from './units';
import type { PaginatedMeta } from './types';

/** Contrato: apis/properties_api_control_rentas.txt */

/** Casa y bodega tienen una sola unidad; edificio, plaza y mixta, varias. */
export type PropertyType = 'house' | 'warehouse' | 'building' | 'shopping_plaza' | 'mixed_use';

export type Property = {
  id: string;
  name: string;
  property_type: PropertyType;
  status: 'active' | 'inactive';
  /** in_progress: incompleta, todavía no aparece en Inicio. */
  configuration_status: 'in_progress' | 'completed';
  configuration_completed_at: string | null;
  configuration_progress: { total_units: number; reviewed_units: number; unreviewed_units: number };
  postal_code: string;
  street: string | null;
  external_number: string | null;
  internal_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  reference_notes: string | null;
  has_units: boolean;
  /** FE-15: conteos completos de unidades no inactivas. `total` incluye las no revisadas. */
  unit_counts: { total: number; occupied: number; available: number; maintenance: number };
  /** FE-16: casa o bodega con su única unidad operable; null en otros tipos o sin unidad. */
  single_unit: {
    id: string;
    name: string;
    status: UnitStatus;
    /** Ocupación actual, aunque el contrato esté vencido; null si nadie la renta. */
    tenant: { id: string; first_name: string; last_name: string } | null;
  } | null;
  created_at: string;
  updated_at: string;
};

type PropertyListParams = {
  search?: string;
  configuration_status?: Property['configuration_status'];
  page: number;
  page_size: number;
};

/** GET /v1/properties — propiedades activas; busca por nombre y dirección. */
export const getProperties = ({ search, ...params }: PropertyListParams, signal?: AbortSignal) =>
  apiRequest<Property[], PaginatedMeta>({
    method: 'GET',
    url: '/properties',
    params: { ...params, ...(search ? { search } : {}) },
    signal,
    operation: 'properties_list',
  });

/** GET /v1/properties/:id — detalle y avance de configuración. */
export const getProperty = (propertyId: string, signal?: AbortSignal) =>
  apiRequest<Property>({
    method: 'GET',
    url: `/properties/${encodeURIComponent(propertyId)}`,
    signal,
    operation: 'property_detail',
  });

/** Datos de P-06 (FE-03): nombre y código postal obligatorios; el resto, opcional. */
export type PropertyInput = {
  name: string;
  property_type: PropertyType;
  postal_code: string;
  street: string | null;
  external_number: string | null;
  internal_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  reference_notes: string | null;
};

/** POST /v1/properties — crea la propiedad incompleta y sin unidades. */
export const createProperty = (body: PropertyInput) =>
  apiRequest<Property>({
    method: 'POST',
    url: '/properties',
    data: body,
    operation: 'property_create',
  });

/** PATCH /v1/properties/:id — solo lo que cambió. */
export const updateProperty = ({
  propertyId,
  changes,
}: {
  propertyId: string;
  changes: Partial<PropertyInput>;
}) =>
  apiRequest<Property>({
    method: 'PATCH',
    url: `/properties/${encodeURIComponent(propertyId)}`,
    data: changes,
    operation: 'property_update',
  });

/** POST /v1/properties/:id/complete-configuration — la habilita para Inicio si todo está revisado. */
export const completePropertyConfiguration = (propertyId: string) =>
  apiRequest<Property>({
    method: 'POST',
    url: `/properties/${encodeURIComponent(propertyId)}/complete-configuration`,
    operation: 'property_complete',
  });

/** PATCH /v1/properties/:id/deactivate — baja lógica; bloqueada si alguien la renta hoy. */
export const deactivateProperty = (propertyId: string) =>
  apiRequest<{ id: string; status: 'inactive'; deactivated_at: string | null }>({
    method: 'PATCH',
    url: `/properties/${encodeURIComponent(propertyId)}/deactivate`,
    operation: 'property_deactivate',
  });
