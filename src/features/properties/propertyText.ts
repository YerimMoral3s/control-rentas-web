import type { Property, PropertyType } from '@api/properties';
import type { UnitType } from '@api/units';

/** Textos de propiedades y unidades, solo presentación. */

const PROPERTY_TYPE: Record<PropertyType, string> = {
  house: 'Casa',
  warehouse: 'Bodega',
  building: 'Edificio',
  shopping_plaza: 'Plaza de locales',
  mixed_use: 'Uso mixto',
};

export const propertyTypeLabel = (type: PropertyType) => PROPERTY_TYPE[type];

/** Casa y bodega: propiedad y su única unidad se presentan juntas (P-04). */
export const isSingleUnit = (type: PropertyType) => type === 'house' || type === 'warehouse';

const UNIT_TYPE: Record<UnitType, [string, string]> = {
  apartment: ['departamento', 'departamentos'],
  commercial_space: ['local', 'locales'],
  full_house: ['casa completa', 'casas completas'],
  warehouse: ['bodega', 'bodegas'],
};

export const unitTypeLabel = (type: UnitType) => UNIT_TYPE[type][0];

/**
 * "4 ocupadas · 1 disponible · 1 en mantenimiento" con los conteos del backend (FE-15); omite ceros.
 * No suma ni completa la diferencia con el total (las no revisadas no son disponibles).
 */
export const unitStatusSummary = (counts: Property['unit_counts']) =>
  [
    counts.occupied > 0
      ? `${counts.occupied} ${counts.occupied === 1 ? 'ocupada' : 'ocupadas'}`
      : '',
    counts.available > 0
      ? `${counts.available} ${counts.available === 1 ? 'disponible' : 'disponibles'}`
      : '',
    counts.maintenance > 0 ? `${counts.maintenance} en mantenimiento` : '',
  ]
    .filter(Boolean)
    .join(' · ');

/** "10 unidades", "1 unidad" (el total lo entrega el backend). */
export const unitCountLabel = (count: number) => `${count} ${count === 1 ? 'unidad' : 'unidades'}`;

/** "Av. Juárez 120 int. 3, Centro, Morelia, CP 58000" con los campos que existan. */
export const addressLine = (property: Property) => {
  const street = [property.street, property.external_number].filter(Boolean).join(' ');
  const internal = property.internal_number ? `int. ${property.internal_number}` : '';
  return [
    [street, internal].filter(Boolean).join(' '),
    property.neighborhood,
    property.city,
    property.state,
    `CP ${property.postal_code}`,
  ]
    .filter(Boolean)
    .join(', ');
};

/** Texto corto de ubicación para listas: colonia o ciudad. */
export const shortLocation = (property: Property) => property.neighborhood || property.city || null;
