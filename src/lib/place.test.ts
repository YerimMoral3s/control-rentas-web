import { describe, expect, it } from 'vitest';
import { placeName, placeParts } from './place';

describe('lugar según tipo de propiedad', () => {
  it('casa y bodega: solo el nombre de la propiedad', () => {
    expect(placeName('Casa completa', { name: 'Casa Encino', property_type: 'house' })).toBe(
      'Casa Encino',
    );
    expect(
      placeParts('Bodega', { name: 'Bodega Poniente', property_type: 'warehouse' }).primary,
    ).toBe('Bodega Poniente');
  });

  it('edificio, plaza, mixta o sin tipo: propiedad / unidad', () => {
    expect(placeName('Departamento 103', { name: 'Torre Centro', property_type: 'building' })).toBe(
      'Torre Centro / Departamento 103',
    );
    expect(placeName('Local 3', { name: 'Plaza Sur' })).toBe('Plaza Sur / Local 3');
  });
});
