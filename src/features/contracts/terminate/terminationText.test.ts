import { describe, expect, it } from 'vitest';
import type { TerminationSummary } from '@api/contracts';
import { cancelledText, chargeDue, monthTitle, retainedText } from './terminationText';

const summary = (over: Partial<TerminationSummary>): TerminationSummary => ({
  as_of_date: '2026-11-19',
  is_early: true,
  cancelled_rents: [],
  cancelled_rents_count: 0,
  cancelled_rents_amount: '0.00',
  cancelled_additional_charges: [],
  cancelled_additional_charges_count: 0,
  cancelled_additional_charges_amount: '0.00',
  cancelled_count: 0,
  cancelled_amount: '0.00',
  retained_payments: {
    scope: 'rental_continuity',
    unpaid_count: 0,
    unpaid_amount: '0.00',
    overdue_count: 0,
    overdue_amount: '0.00',
  },
  ...over,
});

describe('terminationText', () => {
  it('resume rentas y cargos', () => {
    expect(
      cancelledText(summary({ cancelled_rents_count: 2, cancelled_additional_charges_count: 1 })),
    ).toBe('2 rentas y 1 cargo adicional');
    expect(cancelledText(summary({ cancelled_rents_count: 1 }))).toBe('1 renta');
  });

  it('escribe el mes y el vencimiento', () => {
    expect(monthTitle('2026-12')).toBe('Diciembre 2026');
    expect(chargeDue('2026-12-12', '2026-11-19')).toBe('Vence el 12 dic.');
    expect(chargeDue('2027-01-05', '2026-11-19')).toBe('Vence el 5 ene. 2027');
  });

  it('nombra el adeudo que se conserva', () => {
    expect(retainedText(summary({}))).toBe('sus cobros');
    expect(
      retainedText(
        summary({
          retained_payments: {
            scope: 'rental_continuity',
            unpaid_count: 2,
            unpaid_amount: '17000.00',
            overdue_count: 1,
            overdue_amount: '8500.00',
          },
        }),
      ),
    ).toBe('su pago atrasado de $8,500');
  });
});
