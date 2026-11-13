import { useId, useState } from 'react';
import styled from 'styled-components';
import { formatMoney } from '@lib/format';
import { media, theme as tokens } from '@styles/theme';
import { Icon } from '../Icon';

const overdueStripe = `repeating-linear-gradient(135deg, ${tokens.color.danger} 0 3px, ${tokens.color.dangerStripe} 3px 5px)`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
`;

const Header = styled.button`
  min-height: 56px;
  padding: 14px 12px 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.card} ${({ theme }) => theme.radius.card} 0 0;
  background: transparent;
  color: ${({ theme }) => theme.color.neutral950};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }
`;

const HeaderTitle = styled.span`
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
`;

const Cue = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.primary600};
`;

const Chevron = styled.span<{ $open: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.color.primary50};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform ${({ theme }) => theme.motion.revealIn} ${({ theme }) => theme.motion.enter};
`;

const Content = styled.div`
  padding: 2px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  /* Computadora ancha: una fila (Renta esperada | barra | Balance) y el desglose debajo. */
  ${media.wide} {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr) 260px;
    grid-template-areas:
      'expected bar balance'
      'breakdown breakdown breakdown';
    column-gap: 24px;
    row-gap: 0;
    align-items: center;
    padding: 4px 20px 20px;
  }
`;

const Expected = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;

  ${media.wide} {
    grid-area: expected;
    flex-direction: column;
    gap: 2px;
  }
`;

const BarBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${media.wide} {
    grid-area: bar;
    gap: 8px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
`;

const RowLabel = styled.span<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ $color, theme }) => $color ?? theme.color.neutral700};
`;

const BigAmount = styled.span`
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
`;

const Amount = styled.span`
  font-size: 16px;
  font-weight: 700;
`;

const Bar = styled.div`
  display: flex;
  height: 10px;
  gap: 2px;
  border-radius: ${({ theme }) => theme.radius.pill};
  overflow: hidden;
  background: ${({ theme }) => theme.color.neutral100};
`;

const Legend = styled.div`
  display: flex;
  gap: 14px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.neutral700};

  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const Swatch = styled.span<{ $bg: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $bg }) => $bg};
`;

const Collapsible = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition:
    grid-template-rows
      ${({ $open, theme }) => ($open ? theme.motion.revealIn : theme.motion.revealOut)}
      ${({ theme }) => theme.motion.enter},
    opacity ${({ $open, theme }) => ($open ? theme.motion.revealIn : theme.motion.revealOut)}
      ${({ theme }) => theme.motion.enter};

  > div {
    overflow: hidden;
    min-height: 0;
  }

  ${media.wide} {
    grid-area: breakdown;
  }
`;

const Breakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;

  ${media.wide} {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};

    > ${Row} {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 0 16px;
      border-left: 1px solid ${({ theme }) => theme.color.neutral200};
    }

    > ${Row}:first-child {
      padding-left: 0;
      border-left: 0;
    }

    ${Amount} {
      font-size: 20px;
      line-height: 26px;
    }
  }
`;

const ExpensesRow = styled(Row)`
  align-items: center;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  padding-top: 10px;

  ${media.wide} {
    border-top: 0;
    padding-top: 0;
  }
`;

const Balance = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.primary50};
  color: ${({ theme }) => theme.color.primary700};

  ${media.wide} {
    grid-area: balance;
  }
`;

const BalanceText = styled.span`
  display: flex;
  flex-direction: column;

  strong {
    font-size: 15px;
  }

  span {
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

type MonthSummaryProps = {
  /** Nombre del mes como lo entrega la API, por ejemplo "octubre". */
  monthName: string;
  /** Importes del backend (Dashboard money_summary). No se recalculan aquí. */
  expected: string;
  paid: string;
  pending: string;
  overdue: string;
  expenses: string;
  balance: string;
};

const toNumber = (amount: string) => Math.max(Number(amount) || 0, 0);

/**
 * Resumen plegable de F-06. Comprimido al abrir en celular y expandido en computadora;
 * después de la primera interacción se respeta la elección.
 */
export function MonthSummary({
  monthName,
  expected,
  paid,
  pending,
  overdue,
  expenses,
  balance,
}: MonthSummaryProps) {
  // Estado inicial según el dispositivo; luego solo cambia por la usuaria (F-06).
  const [open, setOpen] = useState(
    () => window.matchMedia(`(min-width: ${tokens.breakpoint.desktop})`).matches,
  );
  const contentId = useId();
  const title = `Rentas de ${monthName}`;
  const cue = open ? 'Ocultar desglose' : 'Ver desglose';
  const expensesLabel = Number(expenses) > 0 ? `−${formatMoney(expenses)}` : formatMoney(expenses);

  return (
    <Section aria-label={`Resumen de ${monthName}`}>
      <Header
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        aria-label={`${title}, ${cue}`}
        onClick={() => setOpen(current => !current)}
      >
        <HeaderTitle>{title}</HeaderTitle>
        <Cue>
          {cue}
          <Chevron $open={open}>
            <Icon name="chevronDown" size={18} strokeWidth={2.4} />
          </Chevron>
        </Cue>
      </Header>
      <Content>
        <Expected>
          <RowLabel>Renta esperada</RowLabel>
          <BigAmount>{formatMoney(expected)}</BigAmount>
        </Expected>
        <BarBlock>
          <Bar
            role="img"
            aria-label={`Pagado ${formatMoney(paid)}, Pendiente ${formatMoney(pending)}, Vencido ${formatMoney(overdue)}`}
          >
            <span style={{ flex: toNumber(paid), background: tokens.color.success }} />
            <span style={{ flex: toNumber(pending), background: tokens.color.warningBar }} />
            <span style={{ flex: toNumber(overdue), background: overdueStripe }} />
          </Bar>
          <Legend aria-hidden="true">
            <span>
              <Swatch $bg={tokens.color.success} />
              Pagado
            </span>
            <span>
              <Swatch $bg={tokens.color.warningBar} />
              Pendiente
            </span>
            <span>
              <Swatch $bg={overdueStripe} />
              Vencido
            </span>
          </Legend>
        </BarBlock>
        <Collapsible id={contentId} $open={open} aria-hidden={!open} inert={!open}>
          <div>
            <Breakdown>
              <Row>
                <RowLabel $color={tokens.color.success}>
                  <Icon name="check" size={18} strokeWidth={2.4} />
                  Pagado
                </RowLabel>
                <Amount>{formatMoney(paid)}</Amount>
              </Row>
              <Row>
                <RowLabel $color={tokens.color.warning}>
                  <Icon name="clock" size={18} strokeWidth={2.4} />
                  Pendiente
                </RowLabel>
                <Amount>{formatMoney(pending)}</Amount>
              </Row>
              <Row>
                <RowLabel $color={tokens.color.danger}>
                  <Icon name="alert" size={18} strokeWidth={2.4} />
                  Vencido
                </RowLabel>
                <Amount>{formatMoney(overdue)}</Amount>
              </Row>
              <ExpensesRow>
                <RowLabel>Gastos</RowLabel>
                <Amount>{expensesLabel}</Amount>
              </ExpensesRow>
            </Breakdown>
          </div>
        </Collapsible>
        <Balance>
          <BalanceText>
            <strong>Balance del mes</strong>
            <span>Pagado menos gastos</span>
          </BalanceText>
          <BigAmount>{formatMoney(balance)}</BigAmount>
        </Balance>
      </Content>
    </Section>
  );
}
