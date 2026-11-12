import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import styled from 'styled-components';
import { Button, StateMessage } from '@components';
import { logger } from '@lib/logger';

const Wrapper = styled.div`
  max-width: 560px;
  margin: 48px auto;
  padding: 0 16px;
`;

/** Si una pantalla se rompe, se muestra un mensaje amable en lugar de una página en blanco. */
export function AppErrorScreen() {
  const error = useRouteError();

  useEffect(() => {
    logger.error('render_failed', { name: error instanceof Error ? error.name : 'unknown' });
  }, [error]);

  return (
    <Wrapper>
      <StateMessage
        kind="error"
        title="Algo no salió como esperábamos"
        description="Tus datos están a salvo. Intenta abrir la pantalla otra vez."
        action={
          <Button variant="secondary" icon="retry" onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        }
      />
    </Wrapper>
  );
}
