import { Link } from 'react-router';
import styled, { css } from 'styled-components';

/** Acción terciaria de F-02 como enlace: "Ver detalle", "Ver contrato", "WhatsApp". */
export const actionLinkStyle = css`
  min-height: ${({ theme }) => theme.size.touch};
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: ${({ theme }) => theme.radius.control};
  color: ${({ theme }) => theme.color.primary600};
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.color.primary50};
    color: ${({ theme }) => theme.color.primary700};
  }
`;

export const ActionLink = styled(Link)`
  ${actionLinkStyle}
`;

/** Volver a la lista (encabezado de detalle en celular y computadora). */
export const BackLink = styled(Link)`
  ${actionLinkStyle}
  align-self: flex-start;
  margin-left: -10px;
  padding: 0 10px 0 4px;
  gap: 2px;
`;
