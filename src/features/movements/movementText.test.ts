import { describe, expect, it } from 'vitest';
import type { Movement } from '@api/movements';
import {
  groupByDate,
  movementConcept,
  movementAmount,
  movementKindLine,
  movementLink,
  movementRelated,
} from './movementText';

const movement = (fields: Partial<Movement>): Movement => ({
  source: { type: 'payment', id: 'p1' },
  kind: 'income',
  type: 'monthly_rent',
  amount: '8500.00',
  date: '2026-10-27',
  occurred_at: null,
  concept: 'Renta octubre 2026',
  contract: null,
  tenant: { id: 't', first_name: 'María', last_name: 'López' },
  unit: { id: 'u', name: 'Departamento 101' },
  property: { id: 'p', name: 'Torre Centro', property_type: 'building' },
  ...fields,
});

describe('textos de movimientos', () => {
  it('muestra el signo que trae el importe', () => {
    expect(movementAmount('8500.00')).toBe('+$8,500');
    expect(movementAmount('-3200.00')).toBe('−$3,200');
  });

  it('describe con quién y dónde', () => {
    expect(movementRelated(movement({}))).toBe('María López · Torre Centro / Departamento 101');
    expect(movementRelated(movement({ tenant: null, unit: null }))).toBe('Torre Centro');
  });

  it('describe entrada o gasto sin depender del color', () => {
    expect(movementKindLine(movement({ kind: 'expense', type: 'maintenance' }))).toBe(
      'Gasto · Mantenimiento',
    );
    expect(movementKindLine(movement({}))).toBe('Entrada · Renta');
  });

  it('abre el pago o gasto original', () => {
    expect(movementLink(movement({}))).toBe('/cobros/p1');
    expect(movementLink(movement({ source: { type: 'expense', id: 'e1' } }))).toBe('/gastos/e1');
  });

  it('agrupa por día sin reordenar', () => {
    const groups = groupByDate([
      movement({ date: '2026-10-27' }),
      movement({ date: '2026-10-27' }),
      movement({ date: '2026-10-26' }),
    ]);
    expect(groups.map(group => [group.date, group.items.length])).toEqual([
      ['2026-10-27', 2],
      ['2026-10-26', 1],
    ]);
  });

  it('presenta la clave del periodo como concepto legible (FE-26)', () => {
    expect(movementConcept(movement({ concept: '2026-10' }))).toBe('Renta octubre 2026');
    expect(movementConcept(movement({ type: 'deposit', concept: 'DEPOSIT' }))).toBe('Depósito');
    expect(movementConcept(movement({ type: 'maintenance', concept: 'Pintura y resane' }))).toBe(
      'Pintura y resane',
    );
  });
});
