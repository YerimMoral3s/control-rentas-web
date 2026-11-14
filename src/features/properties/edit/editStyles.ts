import styled from 'styled-components';
import { media } from '@styles/theme';

/** Tarjeta de formulario de P-15 (mismo patrón que T-06 / T-08). */
export const EditCard = styled.form`
  width: 100%;
  max-width: 560px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.panel};

  ${media.desktop} {
    padding: 24px;
  }
`;

export const EditFooter = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};

  ${media.desktop} {
    flex-direction: row-reverse;
    justify-content: flex-start;
    gap: 12px;
  }
`;

/** Dato que no se edita aquí (tipo, estado), con su explicación. */
export const Fixed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};

  strong {
    font-size: 16px;
    color: ${({ theme }) => theme.color.neutral950};
  }
`;

export const EditHead = styled.div`
  span {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;
