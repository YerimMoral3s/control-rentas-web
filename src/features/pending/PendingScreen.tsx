import styled from 'styled-components';
import { StateMessage } from '@components';
import { pageTitle } from '@styles/theme';

export const PageTitle = styled.h1`
  margin: 0 0 20px;
  ${pageTitle}
  font-weight: 700;
`;

type PendingScreenProps = {
  title: string;
};

/**
 * Sección cuyo recorrido todavía no se implementa (ver front-files/fases.md).
 * No muestra datos simulados.
 */
export function PendingScreen({ title }: PendingScreenProps) {
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <StateMessage
        kind="empty"
        title="Esta sección estará lista pronto"
        description="Estamos preparando esta parte de Rentario."
      />
    </>
  );
}
