import { describe, expect, it } from 'vitest';
import { dueText, groupRents, overdueSentence, rentTitle } from './contractPreviewText';

const rent = (period_key: string, status: 'pending' | 'overdue', amount = '9000.00') => ({
  period_key,
  amount,
  due_date: `${period_key}-05`,
  status,
});

describe('revisión de la renta actual', () => {
  it('escribe cada cobro', () => {
    expect(rentTitle('2026-11')).toBe('Renta noviembre 2026');
    expect(dueText(rent('2026-11', 'overdue'))).toBe('Venció el 5 nov.');
    expect(dueText(rent('2026-12', 'pending'))).toBe('Vence el 5 dic.');
    expect(dueText(rent('2027-01', 'pending'), '2026-11-14')).toBe('Vence el 5 ene. 2027');
  });

  it('agrupa los pendientes iguales después del primero', () => {
    const { single, group } = groupRents([
      rent('2026-11', 'overdue'),
      rent('2026-12', 'pending'),
      rent('2027-01', 'pending'),
      rent('2027-02', 'pending'),
    ]);
    expect(single.map(item => item.period_key)).toEqual(['2026-11', '2026-12']);
    expect(group).toEqual({ count: 2, range: 'ene. 2027 a feb. 2027', amount: '9000.00' });
  });

  it('no agrupa si hay menos de dos o importes distintos', () => {
    expect(groupRents([rent('2026-12', 'pending'), rent('2027-01', 'pending')]).group).toBeNull();
    expect(
      groupRents([
        rent('2026-12', 'pending'),
        rent('2027-01', 'pending'),
        rent('2027-02', 'pending', '9500.00'),
      ]).group,
    ).toBeNull();
  });

  it('explica los cobros que nacen Vencidos (C-09)', () => {
    expect(overdueSentence([rent('2026-10', 'overdue'), rent('2026-11', 'pending')])).toBe(
      'Octubre se creará como Vencido porque venció el 5 oct. Las demás, como Pendientes.',
    );
    expect(overdueSentence([rent('2026-11', 'pending')])).toBeNull();
  });
});
