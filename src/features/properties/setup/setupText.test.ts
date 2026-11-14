import { describe, expect, it } from 'vitest';
import type { Unit } from '@api/units';
import {
  existingNames,
  firstPendingStep,
  groupTypesFor,
  joinNames,
  pendingSentence,
  previewNames,
  setupPending,
  unitGroups,
  unitSetupState,
} from './setupText';

const unit = (over: Partial<Unit>): Unit =>
  ({
    id: 'u1',
    name: 'Departamento 101',
    unit_type: 'apartment',
    status: 'available',
    reviewed_at: null,
    ...over,
  }) as Unit;

describe('recorrido de configuración', () => {
  it('arma la vista previa y marca nombres repetidos sin importar mayúsculas', () => {
    const names = previewNames(' Departamento ', 301, 3);
    expect(names).toEqual(['Departamento 301', 'Departamento 302', 'Departamento 303']);
    expect(existingNames(names, [{ name: 'departamento 302' }])).toEqual(['Departamento 302']);
  });

  it('agrupa por tipo con el primero y el último', () => {
    expect(
      unitGroups([
        unit({ name: 'Departamento 102' }),
        unit({ name: 'Departamento 101' }),
        unit({ name: 'Local 1', unit_type: 'commercial_space' }),
      ]),
    ).toEqual([
      { unit_type: 'apartment', count: 2, range: 'Departamento 101 a Departamento 102' },
      { unit_type: 'commercial_space', count: 1, range: 'Local 1' },
    ]);
  });

  it('respeta la matriz de tipos', () => {
    expect(groupTypesFor('shopping_plaza')).toEqual(['commercial_space']);
    expect(groupTypesFor('house')).toEqual([]);
  });

  it('distingue sin revisar, Rentada sin renta y revisadas', () => {
    expect(unitSetupState(unit({}), [])).toBe('pending');
    expect(unitSetupState(unit({ reviewed_at: '2026-11-13' }), ['u1'])).toBe('rented');
    expect(unitSetupState(unit({ status: 'maintenance', reviewed_at: 'x' }), [])).toBe(
      'maintenance',
    );
    const pending = setupPending(
      [unit({ id: 'a' }), unit({ id: 'b' }), unit({ id: 'c', reviewed_at: 'x' })],
      ['c'],
    );
    expect(pendingSentence(pending)).toBe('Falta revisar 2 unidades y cargar 1 renta actual.');
    expect(pendingSentence({ unreviewed: [], missingRent: [] })).toBeNull();
  });

  it('abre el primer paso pendiente', () => {
    const progress = { total_units: 2, reviewed_units: 2, unreviewed_units: 0 };
    const none = { unreviewed: [], missingRent: [] };
    expect(firstPendingStep({ has_units: false, configuration_progress: progress }, none)).toBe(
      'unidades',
    );
    expect(
      firstPendingStep(
        { has_units: true, configuration_progress: { ...progress, unreviewed_units: 1 } },
        none,
      ),
    ).toBe('estados');
    expect(firstPendingStep({ has_units: true, configuration_progress: progress }, none)).toBe(
      'revisar',
    );
  });

  it('une nombres en español', () => {
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B y C');
    expect(joinNames(['A'])).toBe('A');
  });
});
