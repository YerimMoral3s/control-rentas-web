import { Link, useParams } from 'react-router';
import styled from 'styled-components';
import type { PaymentDetail } from '@api/payments';
import {
  ActionLink,
  Button,
  DetailSection,
  Icon,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  StatusBadge,
} from '@components';
import { useAttentionPayments, usePayment } from '@hooks/querys/payments';
import {
  civilDateOf,
  formatDateRange,
  formatDateTime,
  formatDateWithYear,
  monthName,
} from '@lib/dates';
import { formatMoney } from '@lib/format';
import { dueLabel, paymentTitle, paymentTypeLabel, whatsappMessage } from '@lib/paymentText';
import { placeName } from '@lib/place';
import { whatsappUrl } from '@lib/whatsapp';
import { media, theme as tokens } from '@styles/theme';

const Page = styled.div`
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 34px;
  }
`;

const Sub = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const StatusRow = styled.span<{ $overdue: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: ${({ $overdue }) => ($overdue ? 700 : 600)};
  color: ${({ $overdue, theme }) => ($overdue ? theme.color.danger : theme.color.neutral700)};
`;

const AmountBox = styled.div`
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  span {
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.color.neutral700};
  }

  strong {
    font-size: 24px;
    line-height: 30px;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const WhatsAppLink = styled.a`
  min-height: ${({ theme }) => theme.size.touchPrimary};
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.color.primaryBorder};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.primary100};
  color: ${({ theme }) => theme.color.primary700};
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.primaryPressed};
  }
`;

const Data = styled.dl`
  margin: 0;
  padding: 4px 16px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  div {
    padding: 10px 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 12px;
  }

  div + div {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  dt {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    text-align: right;

    ${media.desktop} {
      text-align: left;
    }
  }

  a {
    color: ${({ theme }) => theme.color.primary600};
  }
`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Origen del cobro: generado por el contrato o agregado a mano. */
const originLabel = (payment: PaymentDetail) => {
  if (payment.payment_type === 'additional_services') return 'Cargo adicional';
  if (payment.payment_type === 'deposit') return 'Depósito del contrato';
  return payment.generated_automatically ? 'Renta del contrato' : 'Renta agregada';
};

/** Y-01 a Y-03: detalle de un cobro Pendiente, Vencido, Pagado o Cancelado. */
export function PaymentDetailPage() {
  const { paymentId } = useParams();
  const query = usePayment(paymentId);
  // Fecha operativa del servidor para "Vence hoy" (misma consulta en caché que Inicio).
  const today = useAttentionPayments('all', '').meta?.as_of_date;
  const payment = query.data?.data;
  const back = (
    <ReturnLink to={payment ? `/contratos/${payment.contract.id}` : '/'} label="Volver" />
  );

  if (query.isPending) {
    return (
      <Page aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="120px" $radius={tokens.radius.card} />
      </Page>
    );
  }

  if (query.isError || !payment) {
    return (
      <Page>
        {back}
        {query.error?.type === 'not_found' ? (
          <StateMessage
            kind="empty"
            title="No encontramos este cobro"
            description="Puede que no exista o sea de otra cuenta."
          />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </Page>
    );
  }

  const unpaid = payment.status === 'pending' || payment.status === 'overdue';
  const name = `${payment.tenant.first_name} ${payment.tenant.last_name}`;
  const place = placeName(payment.unit.name, payment.property);

  return (
    <Page>
      {back}
      <Header>
        <h1>{paymentTitle(payment)}</h1>
        <Sub>
          {name} · {place}
        </Sub>
        <StatusRow $overdue={payment.status === 'overdue'}>
          <StatusBadge status={payment.status} />
          {unpaid ? dueLabel(payment, today) : null}
        </StatusRow>
      </Header>

      {payment.status === 'paid' && payment.paid_at ? (
        <Notice tone="success" title={`Pago registrado el ${formatDateTime(payment.paid_at)}.`} />
      ) : null}
      {payment.status === 'cancelled' && payment.canceled_at ? (
        <Notice
          tone="info"
          title={`Cancelado el ${formatDateWithYear(civilDateOf(payment.canceled_at))}.`}
        >
          Ya no se cobra.
        </Notice>
      ) : null}

      <AmountBox>
        <span>Importe</span>
        <strong>{formatMoney(payment.amount)}</strong>
      </AmountBox>

      {/* Registrar y corregir son escrituras de la fase 6: deshabilitadas, sin simular. */}
      <Actions>
        {unpaid ? (
          <>
            <Button disabled title="Disponible próximamente">
              Registrar pago de {formatMoney(payment.amount)}
            </Button>
            <WhatsAppLink
              href={whatsappUrl(payment.tenant.phone, whatsappMessage(payment, today))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="whatsapp" size={18} />
              WhatsApp
            </WhatsAppLink>
          </>
        ) : null}
        {payment.status === 'paid' ? (
          <Button variant="secondary" disabled title="Disponible próximamente">
            Corregir pago
          </Button>
        ) : null}
        <ActionLink to={`/contratos/${payment.contract.id}`}>Ver contrato</ActionLink>
      </Actions>

      <DetailSection title="Detalle">
        <Data>
          <div>
            <dt>Concepto</dt>
            <dd>{paymentTypeLabel(payment)}</dd>
          </div>
          {payment.period_year && payment.period_month ? (
            <div>
              <dt>Periodo</dt>
              <dd>
                {capitalize(monthName(payment.period_year, payment.period_month))}{' '}
                {payment.period_year}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Vencimiento</dt>
            <dd>{formatDateWithYear(payment.due_date)}</dd>
          </div>
          <div>
            <dt>Inquilino</dt>
            <dd>
              <Link to={`/inquilinos/${payment.tenant.id}`}>{name}</Link>
            </dd>
          </div>
          <div>
            <dt>Unidad</dt>
            <dd>
              <Link to={`/unidades/${payment.unit.id}`}>{place}</Link>
            </dd>
          </div>
          <div>
            <dt>Contrato</dt>
            <dd>
              <Link to={`/contratos/${payment.contract.id}`}>
                {payment.contract.contract_type === 'trial' ? 'Prueba' : 'Formal'} ·{' '}
                {formatDateRange(payment.contract.start_date, payment.contract.end_date)}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Origen</dt>
            <dd>{originLabel(payment)}</dd>
          </div>
        </Data>
      </DetailSection>
    </Page>
  );
}
