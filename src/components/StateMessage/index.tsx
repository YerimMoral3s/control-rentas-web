import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Icon } from '../Icon';

const Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.white};
`;

const ErrorIcon = styled.span`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.dangerBg};
  color: ${({ theme }) => theme.color.danger};
`;

const Title = styled.span`
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
`;

const Description = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

type StateMessageProps = {
  /** error: sección que no cargó. empty: primera vez, sin resultados o tarea resuelta. */
  kind: 'error' | 'empty';
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Vacíos y error de sección de F-08 / S-03 a S-06. */
export function StateMessage({ kind, title, description, action }: StateMessageProps) {
  return (
    <Box role={kind === 'error' ? 'alert' : undefined}>
      {kind === 'error' ? (
        <ErrorIcon>
          <Icon name="alert" size={22} strokeWidth={2.4} />
        </ErrorIcon>
      ) : null}
      <Title>{title}</Title>
      {description ? <Description>{description}</Description> : null}
      {action}
    </Box>
  );
}
