import { Link } from 'react-router';
import styled from 'styled-components';
import type { Movement } from '@api/movements';
import { FROM_LIST_STATE, Icon } from '@components';
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
  grid-template-columns: 36px minmax(0, 1fr) auto;
  grid-template-areas:
    'icon concept amount'
    'icon related related'
    'icon kind kind';
  gap: 2px 12px;
  align-items: center;
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

/** M-02 / M-03: círculo verde con flecha hacia dentro (entrada) o gris con flecha hacia fuera (gasto). */
const KindIcon = styled.span<{ $income: boolean }>`
  grid-area: icon;
  align-self: start;
  margin-top: 2px;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.pill};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $income, theme }) => ($income ? theme.color.successBg : theme.color.neutral100)};
  color: ${({ $income, theme }) => ($income ? theme.color.success : theme.color.neutral700)};

  /* En la tabla de computadora el icono va junto al concepto (InlineIcon). */
  ${media.desktop} {
    display: none;
  }
`;

const InlineIcon = styled(KindIcon)`
  display: none;
  width: 28px;
  height: 28px;
  margin: 0;
  align-self: center;

  ${media.desktop} {
    display: flex;
  }
`;

const ConceptCell = styled.span`
  grid-area: concept;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Concept = styled.strong`
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
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** Como el diseño: entrada en verde y gasto en negro; el signo, el icono y el texto también lo dicen. */
const Amount = styled.span<{ $income: boolean }>`
  grid-area: amount;
  justify-self: end;
  align-self: start;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $income, theme }) => ($income ? theme.color.success : theme.color.neutral950)};

  ${media.desktop} {
    align-self: center;
  }
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
            {group.items.map(movement => {
              const income = movement.kind === 'income';
              return (
                <li key={`${movement.source.type}-${movement.source.id}`}>
                  <Row to={movementLink(movement)} state={FROM_LIST_STATE}>
                    <When>
                      {formatShortDate(movement.date)}
                      {movement.occurred_at ? ` · ${formatTime(movement.occurred_at)}` : ''}
                    </When>
                    <KindIcon $income={income} aria-hidden="true">
                      <Icon name={income ? 'moneyIn' : 'moneyOut'} size={18} strokeWidth={2.4} />
                    </KindIcon>
                    <ConceptCell>
                      <InlineIcon $income={income} aria-hidden="true">
                        <Icon name={income ? 'moneyIn' : 'moneyOut'} size={16} strokeWidth={2.4} />
                      </InlineIcon>
                      <Concept>{movementConcept(movement)}</Concept>
                    </ConceptCell>
                    <Related>{movementRelated(movement)}</Related>
                    <Kind>
                      {desktop
                        ? movementKindLine({ ...movement, occurred_at: null })
                        : movementKindLine(movement)}
                    </Kind>
                    <Amount $income={income}>{movementAmount(movement.amount)}</Amount>
                  </Row>
                </li>
              );
            })}
          </Rows>
        </section>
      ))}
    </Groups>
  );
}
