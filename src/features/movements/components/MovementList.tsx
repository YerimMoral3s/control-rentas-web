import { Link } from 'react-router';
import styled from 'styled-components';
import type { Movement } from '@api/movements';
import { FROM_LIST_STATE } from '@components';
import { formatDayHeading, formatShortDate, formatTime } from '@lib/dates';
import { clampLines, media } from '@styles/theme';
import {
  groupByDate,
  movementAmount,
  movementKindLine,
  movementLink,
  movementRelated,
  movementConcept,
} from '../movementText';

const Groups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DayTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  overflow: hidden;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const DESKTOP_COLUMNS = '150px minmax(0, 1.2fr) minmax(0, 1.4fr) minmax(0, 1fr) 110px';

export const HeaderRow = styled.div`
  display: none;

  ${media.desktop} {
    display: grid;
    grid-template-columns: ${DESKTOP_COLUMNS};
    gap: 16px;
    padding: 0 20px 8px;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Row = styled(Link)`
  padding: 12px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'concept amount'
    'related related'
    'kind kind';
  gap: 2px 12px;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  ${media.desktop} {
    min-height: 56px;
    padding: 10px 20px;
    align-items: center;
    grid-template-columns: ${DESKTOP_COLUMNS};
    grid-template-areas: 'when concept related kind amount';
    gap: 16px;
  }
`;

const When = styled.span`
  display: none;
  grid-area: when;
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};

  ${media.desktop} {
    display: block;
  }
`;

const Concept = styled.strong`
  grid-area: concept;
  font-size: 15px;
  line-height: 22px;
  ${clampLines(2)}
`;

const Related = styled.span`
  grid-area: related;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral700};

  ${media.desktop} {
    font-size: 15px;
  }
`;

const Kind = styled.span`
  grid-area: kind;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

/** Sin color por tipo: el verde es solo para Pagado y éxito; el signo y "Entrada"/"Gasto" dan el significado. */
const Amount = styled.span`
  grid-area: amount;
  justify-self: end;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
`;

type MovementListProps = {
  movements: Movement[];
  /** Fecha operativa del servidor, para marcar "Hoy". */
  today: string | undefined;
  /** En computadora la hora va en la columna Fecha y no en la línea de tipo. */
  desktop: boolean;
};

/** M-01 a M-03: lista agrupada por día; cada fila abre el pago o gasto original. */
export function MovementList({ movements, today, desktop }: MovementListProps) {
  return (
    <Groups>
      {groupByDate(movements).map(group => (
        <section key={group.date} aria-label={formatDayHeading(group.date)}>
          <DayTitle>
            {group.date === today ? 'Hoy · ' : ''}
            {formatDayHeading(group.date)}
          </DayTitle>
          <Rows>
            {group.items.map(movement => (
              <li key={`${movement.source.type}-${movement.source.id}`}>
                <Row to={movementLink(movement)} state={FROM_LIST_STATE}>
                  <When>
                    {formatShortDate(movement.date)}
                    {movement.occurred_at ? ` · ${formatTime(movement.occurred_at)}` : ''}
                  </When>
                  <Concept>{movementConcept(movement)}</Concept>
                  <Related>{movementRelated(movement)}</Related>
                  <Kind>
                    {desktop
                      ? movementKindLine({ ...movement, occurred_at: null })
                      : movementKindLine(movement)}
                  </Kind>
                  <Amount>{movementAmount(movement.amount)}</Amount>
                </Row>
              </li>
            ))}
          </Rows>
        </section>
      ))}
    </Groups>
  );
}
