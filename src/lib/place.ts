import type { PropertyType } from '@api/properties';

type PlaceProperty = { name: string; property_type?: PropertyType };

/**
 * Lugar como lo escribe UI/UX (FE-14, FE-22): casa o bodega pone primero la unidad
 * ("Casa 1 · Fraccionamiento Sol"); edificio, plaza o mixta, la propiedad
 * ("Torre Centro / Departamento 203"). Sin tipo, la segunda forma.
 */
export const placeParts = (unitName: string, property: PlaceProperty) =>
  property.property_type === 'house' || property.property_type === 'warehouse'
    ? { primary: unitName, separator: ' · ', secondary: property.name }
    : { primary: property.name, separator: ' / ', secondary: unitName };

export const placeName = (unitName: string, property: PlaceProperty) => {
  const { primary, separator, secondary } = placeParts(unitName, property);
  return `${primary}${separator}${secondary}`;
};
