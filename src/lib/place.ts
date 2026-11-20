import type { PropertyType } from '@api/properties';

type PlaceProperty = { name: string; property_type?: PropertyType };

/**
 * Lugar como lo escribe UI/UX (FE-14, FE-22 y acuerdo de 4B): casa o bodega tienen una sola
 * unidad ("Casa completa", "Bodega"), así que basta el nombre de la propiedad ("Casa Encino").
 * Edificio, plaza o mixta: propiedad / unidad ("Torre Centro / Departamento 203"). Sin tipo,
 * la segunda forma.
 */
export const placeParts = (unitName: string, property: PlaceProperty) =>
  property.property_type === 'house' || property.property_type === 'warehouse'
    ? { primary: property.name, separator: '', secondary: '' }
    : { primary: property.name, separator: ' / ', secondary: unitName };

export const placeName = (unitName: string, property: PlaceProperty) => {
  const { primary, separator, secondary } = placeParts(unitName, property);
  return `${primary}${separator}${secondary}`;
};

/** Nombre corto de la unidad (títulos y diálogos): "Departamento 2"; casa o bodega, "Casa Encino". */
export const shortPlaceName = (unitName: string, property: PlaceProperty) =>
  placeParts(unitName, property).secondary || property.name;
