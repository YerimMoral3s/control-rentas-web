import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { TextField } from '.';

describe('TextField', () => {
  it('un importe ignora letras y pone el separador de miles mientras escribes', async () => {
    renderWithTheme(<TextField label="Renta mensual" format="money" />);
    const input = screen.getByLabelText('Renta mensual');

    await userEvent.type(input, '85x00ab');
    expect(input).toHaveValue('8,500');
  });

  it('un teléfono solo acepta dígitos y se agrupa de dos en dos', async () => {
    renderWithTheme(<TextField label="Teléfono" format="phone" />);
    const input = screen.getByLabelText('Teléfono');

    await userEvent.type(input, '55 12a3-4');
    expect(input).toHaveValue('55 12 34');
  });
});
