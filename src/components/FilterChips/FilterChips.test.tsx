import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { FilterChips } from '.';

const options = [
  { value: 'all', label: 'Todos', count: 12 },
  { value: 'rest', label: 'Resto del mes', count: 0 },
] as const;

describe('FilterChips', () => {
  it('un chip en cero se anuncia como no disponible y no se puede elegir', async () => {
    const onChange = vi.fn();
    renderWithTheme(
      <FilterChips label="Filtrar" options={options} value="all" onChange={onChange} />,
    );

    const zero = screen.getByRole('tab', { name: 'Resto del mes, 0, no disponible' });
    expect(zero).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(zero);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('el chip activo conserva la selección aunque una búsqueda lo deje en cero', () => {
    renderWithTheme(
      <FilterChips label="Filtrar" options={options} value="rest" onChange={vi.fn()} />,
    );

    const active = screen.getByRole('tab', { name: 'Resto del mes, 0' });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(active).not.toHaveAttribute('aria-disabled');
  });
});
