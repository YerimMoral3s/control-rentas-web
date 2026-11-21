import { describe, expect, it } from 'vitest';
import type { FinancialOperation, FinancialVersion } from '@api/movements';
import { operationSummary, operationTitle, versionAmountLine } from './historyText';

const version = (fields: Partial<FinancialVersion>): FinancialVersion => ({
  id: 'v1',
  state: 'reversed',
  kind: 'expense',
  type: 'maintenance',
  amount: '-1200.00',
  concept: 'Pintura y resane',
  date: '2026-10-24',
  occurred_at: null,
  recorded_at: '2026-10-24T18:00:00.000Z',
  context: {
    contract: null,
    tenant: null,
    unit: { id: 'u', name: 'Departamento 102' },
    property: { id: 'p', name: 'Torre Centro', property_type: 'building' },
    period_key: null,
    concept_reference: null,
    description: 'Pintura y resane',
  },
  ...fields,
});

const operation = (fields: Partial<FinancialOperation>): FinancialOperation => ({
  id: 'o1',
  type: 'corrected',
  recorded_at: '2026-11-14T16:42:00.000Z',
  before: null,
  after: null,
  ...fields,
});

describe('historial de correcciones', () => {
  it('describe una corrección de importe sin calcular diferencias', () => {
    expect(
      operationSummary(
        operation({
          before: version({}),
          after: version({ id: 'v2', state: 'current', amount: '-1000.00' }),
        }),
      ),
    ).toBe('Se corrigió el importe de $1,200 a $1,000.');
  });

  it('distingue un pago dejado sin efecto y un gasto anulado', () => {
    expect(
      operationSummary(operation({ before: version({ kind: 'income', amount: '8500.00' }) })),
    ).toBe('El pago se dejó sin efecto.');
    expect(operationSummary(operation({ type: 'voided', before: version({}) }))).toBe(
      'El gasto se dejó sin efecto.',
    );
  });

  it('nombra cada operación y su importe', () => {
    expect(operationTitle(operation({ type: 'recorded' }))).toBe('Registro original');
    expect(operationTitle(operation({ type: 'received_again' }))).toBe(
      'Pago registrado nuevamente',
    );
    expect(versionAmountLine(version({}))).toBe('Gasto de $1,200');
  });
});
