import { describe, expect, it } from 'vitest';
import type { Tenant } from '@api/tenants';
import { hasOverdueDebt, occupationSummary, rentingLine } from './tenantText';

const unit = (name: string) => ({ id: name, name, property: { id: 'p', name: 'Torre Centro' } });

const tenant = (units: string[], amount = '0.00'): Tenant => ({
  id: 't',
  first_name: 'María',
  last_name: 'López',
  alias: null,
  phone: '5512345678',
  secondary_phone: null,
  notes: null,
  status: 'active',
  current_contracts: units.map(name => ({ id: `c-${name}`, status: 'active', unit: unit(name) })),
  overdue_debt: {
    as_of_date: '2026-11-13',
    amount,
    payment_count: 0,
    historical_amount: '0.00',
    by_unit: [],
  },
  created_at: '',
  updated_at: '',
});

describe('textos de inquilino', () => {
  it('describe cuántas unidades renta', () => {
    expect(rentingLine(tenant([]))).toBe('No renta ninguna unidad actualmente');
    expect(rentingLine(tenant(['Depto 101']))).toBe('Actualmente renta 1 unidad');
    expect(rentingLine(tenant(['Depto 101', 'Depto 102']))).toBe('Actualmente renta 2 unidades');
  });

  it('resume las ocupaciones para la lista', () => {
    expect(occupationSummary(tenant(['Depto 101']))).toEqual({
      title: 'Torre Centro / Depto 101',
      detail: null,
    });
    expect(occupationSummary(tenant(['A', 'B']))).toEqual({ title: '2 unidades', detail: 'A, B' });
  });

  it('solo marca adeudo cuando el backend reporta un importe mayor a cero', () => {
    expect(hasOverdueDebt(tenant([], '0.00'))).toBe(false);
    expect(hasOverdueDebt(tenant([], '950.00'))).toBe(true);
  });
});
