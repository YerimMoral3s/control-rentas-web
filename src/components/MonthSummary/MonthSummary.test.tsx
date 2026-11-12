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

    const header = screen.getByRole('button', { name: 'Rentas de octubre, Ver desglose' });
    expect(header).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(header);

    expect(
      screen.getByRole('button', { name: 'Rentas de octubre, Ocultar desglose' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra los importes del servidor sin recalcularlos', () => {
    renderWithTheme(<MonthSummary {...props} />);

    expect(
      screen.getByRole('img', { name: /Pagado .*85,000.*Pendiente .*25,000.*Vencido .*10,000/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/66,500/)).toBeInTheDocument();
  });
});
