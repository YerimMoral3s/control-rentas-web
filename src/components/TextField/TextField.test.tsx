import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { TextField } from '.';

describe('TextField', () => {
  it('un importe ignora letras y muestra separador de miles al salir', async () => {
    renderWithTheme(<TextField label="Renta mensual" format="money" />);
    const input = screen.getByLabelText('Renta mensual');

    await userEvent.type(input, '85x00ab');
    expect(input).toHaveValue('8500');

    await userEvent.tab();
    expect(input).toHaveValue('8,500');
  });

  it('un teléfono solo acepta dígitos y espacios', async () => {
    renderWithTheme(<TextField label="Teléfono" format="phone" />);
    const input = screen.getByLabelText('Teléfono');

    await userEvent.type(input, '55 12a3-4');
    expect(input).toHaveValue('55 1234');
  });
});
