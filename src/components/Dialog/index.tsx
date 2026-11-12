import { useEffect, useId, useRef, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';
import { media } from '@styles/theme';

const sheetIn = keyframes`from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: none; }`;
const dialogIn = keyframes`from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: none; }`;
const backdropIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

/**
 * F-07: hoja inferior en celular y diálogo de 480 px en computadora. Usa <dialog> nativo:
 * atrapa el foco, Esc cancela y el foco vuelve al botón que lo abrió.
 */
const StyledDialog = styled.dialog`
  margin: auto auto 0;
  width: 100%;
  max-width: 100%;
  padding: 24px 16px calc(16px + env(safe-area-inset-bottom));
  border: 0;
  border-radius: ${({ theme }) => theme.radius.panel} ${({ theme }) => theme.radius.panel} 0 0;
  background: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.neutral950};
  box-shadow: 0 -8px 24px rgba(16, 24, 40, 0.12);

  &[open] {
    animation: ${sheetIn} ${({ theme }) => theme.motion.layerIn}
      ${({ theme }) => theme.motion.enter};
  }

  &::backdrop {
    background: rgba(16, 24, 40, 0.45);
    animation: ${backdropIn} ${({ theme }) => theme.motion.layerIn}
      ${({ theme }) => theme.motion.enter};
  }

  ${media.desktop} {
    margin: auto;
    width: ${({ theme }) => theme.size.dialog};
    padding: 24px;
    border-radius: ${({ theme }) => theme.radius.panel};
    box-shadow: 0 20px 48px rgba(16, 24, 40, 0.18);

    &[open] {
      animation-name: ${dialogIn};
    }
  }
`;

const Title = styled.h2`
  margin: 0 0 12px;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
`;

/** Celular: acción final arriba y Cancelar debajo. Computadora: Cancelar a la izquierda. */
export const DialogActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;

  ${media.desktop} {
    flex-direction: row-reverse;
    justify-content: flex-start;
  }
`;

type DialogProps = {
  open: boolean;
  title: string;
  /** Cancelar, Esc o tocar fuera. Se ignora mientras `busy` para no interrumpir un guardado. */
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
};

export function Dialog({ open, title, onClose, busy = false, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Mientras el diálogo está abierto, la página de fondo no se desplaza.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (open && !dialog.open) {
      dialog.showModal();
      // F-07: en acciones de peligro el foco inicia en Cancelar (marcado con data-initial-focus).
      dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <StyledDialog
      ref={ref}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      onCancel={event => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <Title id={titleId}>{title}</Title>
      {children}
    </StyledDialog>
  );
}
