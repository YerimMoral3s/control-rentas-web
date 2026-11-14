import type { ReactNode } from 'react';
import styled from 'styled-components';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
`;

const Count = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.neutral600};
`;

/** Bloque titulado de un detalle ("Pagos atrasados", "Unidades", "Historial", "Gastos"). */
type DetailSectionProps = {
  title: string;
  count?: number;
  /** Acción contextual a la derecha del título (por ejemplo, "Registrar gasto"). */
  action?: ReactNode;
  children: ReactNode;
};

export function DetailSection({ title, count, action, children }: DetailSectionProps) {
  return (
    <Section aria-label={title}>
      <Head>
        <Title>
          {title}
          {count !== undefined ? <Count>· {count}</Count> : null}
        </Title>
        {action}
      </Head>
      {children}
    </Section>
  );
}

export const Panel = styled.div`
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
`;

export const MutedText = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;
