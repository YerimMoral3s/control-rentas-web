import { Link } from 'react-router';
import styled from 'styled-components';
import { MonthSummary, Skeleton, StateMessage } from '@components';
import { useDashboardSummary } from '@hooks/querys/dashboard';
import { useAttentionPayments } from '@hooks/querys/payments';
import { formatLongDate, monthName } from '@lib/dates';
import { useMediaQuery } from '@lib/useMediaQuery';
import { theme as tokens } from '@styles/theme';
import { AttentionPayments } from './components/AttentionPayments';
import { RentalAlerts } from './components/RentalAlerts';
import { SectionError } from './components/SectionError';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DateLine = styled.span`
  min-height: 18px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  line-height: 34px;
  font-weight: 700;
`;

const SetupLink = styled(Link)`
  height: ${({ theme }) => theme.size.touchPrimary};
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.primary600};
  color: ${({ theme }) => theme.color.white};
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.primary700};
  }
`;

/** "2026-10" → "octubre". */
const periodMonthName = (period: string) => {
  const [year = 0, month = 1] = period.split('-').map(Number);
  return monthName(year, month);
};

/** Fecha operativa del servidor; misma consulta (y caché) que la lista de Pagos por atender. */
function TodayLine() {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  const { meta } = useAttentionPayments('all', '');
  const today = meta?.as_of_date;
  if (!today) return <DateLine aria-hidden="true" />;
  return (
    <DateLine>
      {isDesktop ? `${formatLongDate(today)} de ${today.slice(0, 4)}` : formatLongDate(today)}
    </DateLine>
  );
}

/** H-01: Inicio con datos reales. Cada bloque carga y falla por separado (H-12). */
export function HomePage() {
  const dashboard = useDashboardSummary();
  const summary = dashboard.data?.data;

  const header = (
    <Header>
      <TodayLine />
      <Title>Inicio</Title>
    </Header>
  );

  if (summary && summary.rental_summary.properties_active === 0) {
    return (
      <Page>
        {header}
        <StateMessage
          kind="empty"
          title="Configura tus rentas para empezar"
          description="Agrega tu primera propiedad, sus unidades y quién las renta. Puedes guardar y continuar después."
          action={<SetupLink to="/propiedades">Configurar mis rentas</SetupLink>}
        />
      </Page>
    );
  }

  return (
    <Page>
      {header}
      {dashboard.isPending ? (
        <Skeleton $height="220px" $radius={tokens.radius.card} />
      ) : dashboard.isError ? (
        <SectionError onRetry={() => void dashboard.refetch()} retrying={dashboard.isFetching} />
      ) : (
        <>
          <MonthSummary
            monthName={periodMonthName(dashboard.data.data.period.month)}
            expected={dashboard.data.data.money_summary.expected_income}
            paid={dashboard.data.data.money_summary.collected_income}
            pending={dashboard.data.data.money_summary.pending_income}
            overdue={dashboard.data.data.money_summary.overdue_income}
            expenses={dashboard.data.data.money_summary.expenses}
            balance={dashboard.data.data.money_summary.net}
          />
          <RentalAlerts alerts={dashboard.data.data.rental_summary} />
        </>
      )}
      <AttentionPayments />
    </Page>
  );
}
