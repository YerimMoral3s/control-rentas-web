import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { MonthSummary } from '.';

const props = {
  monthName: 'octubre',
  expected: '120000.00',
  paid: '85000.00',
  pending: '25000.00',
  overdue: '10000.00',
  expenses: '18500.00',
  balance: '66500.00',
};

describe('MonthSummary', () => {
  it('en celular inicia comprimido y la cabecera completa abre el desglose', async () => {
    renderWithTheme(<MonthSummary {...props} />);

    const header = screen.getByRole('button', {
      name: 'Resumen de rentas · Octubre, Ver desglose',
    });
    expect(header).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(header);

    expect(
      screen.getByRole('button', { name: 'Resumen de rentas · Octubre, Ocultar desglose' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra los importes del servidor sin recalcularlos', () => {
    renderWithTheme(<MonthSummary {...props} />);

    expect(
      screen.getByRole('img', {
        name: /Rentas pagadas .*85,000.*Rentas pendientes .*25,000.*Rentas vencidas .*10,000/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/66,500/)).toBeInTheDocument();
  });

  it('aclara a la vista que solo cuenta rentas', () => {
    renderWithTheme(<MonthSummary {...props} />);

    expect(screen.getByText('No incluye depósitos ni cargos adicionales.')).toBeVisible();
  });
});
