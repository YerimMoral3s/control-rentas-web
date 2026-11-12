import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { SearchField } from '.';

function Harness() {
  const [value, setValue] = useState('Torre');
  return <SearchField label="Buscar" placeholder="Buscar" value={value} onChange={setValue} />;
}

describe('SearchField', () => {
  it('Limpiar aparece solo con texto, vacía el campo y regresa el foco', async () => {
    renderWithTheme(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));

    const input = screen.getByRole('searchbox', { name: 'Buscar' });
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).not.toBeInTheDocument();
  });
});
