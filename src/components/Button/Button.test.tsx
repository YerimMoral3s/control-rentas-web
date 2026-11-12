import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { Button } from '.';

describe('Button', () => {
  it('mientras guarda muestra "Guardando…", se deshabilita y no permite un segundo envío', async () => {
    const onClick = vi.fn();
    renderWithTheme(
      <Button loading onClick={onClick}>
        Registrar pago
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Guardando…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
