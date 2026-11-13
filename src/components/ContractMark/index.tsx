import styled from 'styled-components';

const Mark = styled.span<{ $previous: boolean }>`
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  flex: none;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px ${({ $previous }) => ($previous ? 'dashed' : 'solid')}
    ${({ $previous, theme }) => ($previous ? theme.color.neutral400 : theme.color.infoBorder)};
  background: ${({ $previous, theme }) => ($previous ? theme.color.white : theme.color.infoBg)};
  color: ${({ $previous, theme }) => ($previous ? theme.color.neutral600 : theme.color.info)};
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
`;

/** Marca de UI/UX: "Contrato actual" (azul suave) o "Contrato anterior" (borde punteado). */
export function ContractMark({ current }: { current: boolean }) {
  return <Mark $previous={!current}>{current ? 'Contrato actual' : 'Contrato anterior'}</Mark>;
}
