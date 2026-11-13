import { describe, expect, it } from 'vitest';
import type { Property } from '@api/properties';
import { addressLine, isSingleUnit, unitCountLabel, unitStatusSummary } from './propertyText';

const property = (fields: Partial<Property>): Property => ({
  id: 'p',
  name: 'Torre Centro',
  property_type: 'building',
  status: 'active',
  configuration_status: 'completed',
  configuration_completed_at: null,
  configuration_progress: { total_units: 0, reviewed_units: 0, unreviewed_units: 0 },
  postal_code: '58000',
  street: null,
  external_number: null,
  internal_number: null,
  neighborhood: null,
  city: null,
  state: null,
  reference_notes: null,
  has_units: true,
  unit_counts: { total: 0, occupied: 0, available: 0, maintenance: 0 },
  single_unit: null,
  created_at: '',
  updated_at: '',
  ...fields,
});

describe('textos de propiedad', () => {
  it('arma la dirección solo con los campos capturados', () => {
    expect(addressLine(property({}))).toBe('CP 58000');
    expect(
      addressLine(
        property({
          street: 'Av. Juárez',
          external_number: '120',
          internal_number: '3',
          neighborhood: 'Centro',
          city: 'Morelia',
        }),
      ),
    ).toBe('Av. Juárez 120 int. 3, Centro, Morelia, CP 58000');
  });

  it('identifica casa y bodega como propiedades de una sola unidad', () => {
    expect(isSingleUnit('house')).toBe(true);
    expect(isSingleUnit('warehouse')).toBe(true);
    expect(isSingleUnit('building')).toBe(false);
  });

  it('cuenta unidades en singular y plural', () => {
    expect(unitCountLabel(1)).toBe('1 unidad');
    expect(unitCountLabel(10)).toBe('10 unidades');
  });

  it('resume los conteos del backend sin completar la diferencia con el total', () => {
    expect(unitStatusSummary({ total: 10, occupied: 7, available: 2, maintenance: 1 })).toBe(
      '7 ocupadas · 2 disponibles · 1 en mantenimiento',
    );
    expect(unitStatusSummary({ total: 8, occupied: 1, available: 0, maintenance: 0 })).toBe(
      '1 ocupada',
    );
    expect(unitStatusSummary({ total: 3, occupied: 0, available: 0, maintenance: 0 })).toBe('');
  });
});
