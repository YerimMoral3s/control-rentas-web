import type { ReactNode } from 'react';
import styled from 'styled-components';

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 34px;
  }
`;

const Subtitle = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

type DetailHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children?: ReactNode;
};

/** Encabezado de detalle: título, etiqueta de estado y contexto. */
export function DetailHeader({ title, subtitle, badge, children }: DetailHeaderProps) {
  return (
    <Header>
      <TitleRow>
        <h1>{title}</h1>
        {badge}
      </TitleRow>
      {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      {children}
    </Header>
  );
}

export const DetailPage = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
