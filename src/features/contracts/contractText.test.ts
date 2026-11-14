import { describe, expect, it } from 'vitest';
import type { Contract } from '@api/contracts';
import { contractDatesLine, contractKindLine } from './contractText';

const contract = (fields: Partial<Contract>): Contract => ({
  id: 'c',
  contract_type: 'formal',
  status: 'active',
  is_current: true,
  start_date: '2026-10-01',
  end_date: '2027-09-30',
  rent_amount: '8500.00',
  tenant: { id: 't', first_name: 'María', last_name: 'López', alias: null, phone: '5512345678' },
  unit: { id: 'u', name: 'Departamento 101' },
  property: { id: 'p', name: 'Torre Centro', property_type: 'building' },
  deposit: null,
  next_contract: null,
  previous_contract_id: null,
  vacated_at: null,
  duration_months: 12,
  fixed_due_day: 5,
  is_preexisting: false,
  terminated_early_at: null,
  ...fields,
});

describe('textos de contrato', () => {
  it('describe tipo y duración', () => {
    expect(contractKindLine(contract({}))).toBe('Formal · 12 meses');
    expect(contractKindLine(contract({ contract_type: 'trial', duration_months: 1 }))).toBe(
      'Prueba · 1 mes',
    );
  });

  it('elige la línea de fechas según el estado', () => {
    expect(contractDatesLine(contract({}))).toBe('1 oct. 2026 – 30 sep. 2027');
    expect(contractDatesLine(contract({ status: 'expired', end_date: '2026-09-30' }))).toBe(
      'Venció el 30 sep. 2026 · sigue rentando',
    );
    expect(
      contractDatesLine(
        contract({
          status: 'terminated',
          is_current: false,
          vacated_at: '2026-10-22T18:00:00.000Z',
        }),
      ),
    ).toBe('Terminó el 22 oct. 2026');
  });
});
