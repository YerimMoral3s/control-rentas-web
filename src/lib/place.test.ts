import { describe, expect, it } from 'vitest';
import { placeName, placeParts } from './place';

describe('lugar según tipo de propiedad', () => {
  it('casa y bodega: unidad primero', () => {
    expect(placeName('Casa 1', { name: 'Casa Encino', property_type: 'house' })).toBe(
      'Casa 1 · Casa Encino',
    );
    expect(
      placeParts('Bodega 1', { name: 'Bodega Poniente', property_type: 'warehouse' }).primary,
    ).toBe('Bodega 1');
  });

  it('edificio, plaza, mixta o sin tipo: propiedad / unidad', () => {
    expect(placeName('Departamento 103', { name: 'Torre Centro', property_type: 'building' })).toBe(
      'Torre Centro / Departamento 103',
    );
    expect(placeName('Local 3', { name: 'Plaza Sur' })).toBe('Plaza Sur / Local 3');
  });
});
