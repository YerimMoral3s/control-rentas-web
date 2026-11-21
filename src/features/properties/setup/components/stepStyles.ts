import styled from 'styled-components';
import { media } from '@styles/theme';

/** Piezas comunes de cada paso del recorrido (P-05 a P-12). */

export const StepPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 16px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.panel};

  ${media.table} {
    padding: 24px;
  }
`;

export const StepIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 26px;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

export const StepFooter = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};

  ${media.table} {
    flex-direction: row-reverse;
    justify-content: flex-start;
    gap: 12px;
  }
`;

export const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;

  > li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

export const RowText = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 16px;
    line-height: 22px;
    overflow-wrap: anywhere;
  }

  small {
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

/**
 * En celular el pie queda fijo sobre la barra de navegación, para avanzar sin bajar hasta el
 * final de una lista larga (pedido del usuario, 14 nov.). En computadora es un pie normal.
 */
export const StickyStepFooter = styled(StepFooter)`
  @media (max-width: calc(${({ theme }) => theme.breakpoint.table} - 0.02px)) {
    position: sticky;
    /* Tableta: sin barra inferior (hay barra lateral), el pie va pegado al borde. */
    bottom: env(safe-area-inset-bottom);
    z-index: 1;
    margin: 0 -16px -20px;
    padding: 12px 16px;
    background: ${({ theme }) => theme.color.white};
    border-radius: 0 0 ${({ theme }) => theme.radius.panel} ${({ theme }) => theme.radius.panel};
    box-shadow: 0 -8px 16px -12px rgba(16, 24, 40, 0.25);
  }

  /* Teléfono: encima de la barra inferior. */
  @media (max-width: calc(${({ theme }) => theme.breakpoint.desktop} - 0.02px)) {
    bottom: calc(${({ theme }) => theme.size.bottomNav} + env(safe-area-inset-bottom));
  }
`;
