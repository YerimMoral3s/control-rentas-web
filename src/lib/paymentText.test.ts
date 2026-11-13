import { describe, expect, it } from 'vitest';
import type { Payment } from '@api/payments';
import { dueLabel, paymentConcept, tenantName, whatsappMessage } from './paymentText';

const payment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'p1',
  payment_type: 'monthly_rent',
  status: 'pending',
  period_year: 2026,
  period_month: 10,
  period_key: '2026-10',
  amount: '8500.00',
  due_date: '2026-10-29',
  paid_at: null,
  canceled_at: null,
  concept_reference: null,
  generated_automatically: true,
  contract: { id: 'c1', status: 'active', contract_type: 'formal' },
  tenant: { id: 't1', first_name: 'María', last_name: 'López', alias: null, phone: '5512345678' },
  unit: { id: 'u1', name: 'Departamento 101' },
  property: { id: 'pr1', name: 'Torre Centro', property_type: 'building' },
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

describe('textos de un cobro', () => {
  it('nombra el concepto según el tipo de cobro', () => {
    expect(paymentConcept(payment())).toBe('Renta octubre');
    expect(paymentConcept(payment({ payment_type: 'deposit' }))).toBe('Depósito');
    expect(
      paymentConcept(
        payment({ payment_type: 'additional_services', concept_reference: 'Cargo de luz' }),
      ),
    ).toBe('Cargo de luz');
  });

  it('usa el estado del servidor y su fecha operativa para el vencimiento', () => {
    expect(dueLabel(payment({ status: 'overdue', due_date: '2026-10-05' }), '2026-10-27')).toMatch(
      /^Venció el 5 oct/,
    );
    expect(dueLabel(payment({ due_date: '2026-10-27' }), '2026-10-27')).toBe('Vence hoy');
    expect(dueLabel(payment(), '2026-10-27')).toMatch(/^Vence el 29 oct/);
  });

  it('arma nombre y mensaje de WhatsApp amables', () => {
    expect(tenantName(payment().tenant)).toBe('María López');
    expect(whatsappMessage(payment(), '2026-10-27')).toMatch(
      /^Hola María, te escribo por renta octubre de Departamento 101/,
    );
  });
});
