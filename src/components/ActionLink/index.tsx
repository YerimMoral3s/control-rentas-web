import { Link, useLocation, useNavigate } from 'react-router';
import { Icon } from '../Icon';
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

/** Estado que pone una lista en sus enlaces; Volver regresa a ella con búsqueda y posición. */
export const FROM_LIST_STATE = { fromList: true } as const;

/**
 * Volver: si se llegó desde la lista, regresa en el historial (conserva búsqueda, filtros y
 * posición); si se abrió el enlace directo, va a `to`.
 */
export function ReturnLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromList = (location.state as { fromList?: boolean } | null)?.fromList === true;
  return (
    <BackLink
      to={to}
      onClick={event => {
        if (!fromList) return;
        event.preventDefault();
        void navigate(-1);
      }}
    >
      <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
      {label}
    </BackLink>
  );
}
