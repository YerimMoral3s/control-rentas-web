import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/render';
import { Dialog } from '.';

describe('Dialog', () => {
  it('bloquea el desplazamiento de la página mientras está abierto y lo restaura al cerrar', () => {
    const { rerender } = renderWithTheme(
      <Dialog open title="Terminar y desocupar" onClose={vi.fn()}>
        Contenido
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Dialog open={false} title="Terminar y desocupar" onClose={vi.fn()}>
        Contenido
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe('');
  });
});
