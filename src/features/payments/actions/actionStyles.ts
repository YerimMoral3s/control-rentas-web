import styled from 'styled-components';

/** Persona y lugar bajo el título del diálogo. */
export const Who = styled.p`
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};

  strong {
    color: ${({ theme }) => theme.color.neutral950};
  }
`;

/** Datos del cobro en la revisión (concepto, vencimiento, estado, importe). */
export const Facts = styled.dl`
  margin: 0 0 12px;
  padding: 4px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  div {
    padding: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  div + div {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  dt {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    text-align: right;
  }
`;

export const Text = styled.p`
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

export const List = styled.ul`
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** Campos de un formulario dentro de un diálogo, con su separación. */
export const Fields = styled.div`
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
