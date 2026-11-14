import styled from 'styled-components';
import type { Payment } from '@api/payments';
import { ActionLink, FROM_LIST_STATE, StatusBadge } from '@components';
import { formatMoney } from '@lib/format';
import { placeParts } from '@lib/place';
import { dueLabel, paymentConcept, tenantName } from '@lib/paymentText';
import { PaymentWhatsApp, RegisterPaymentButton } from './PaymentActions';

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const Who = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 16px;
    line-height: 22px;
  }
`;

const Concept = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Place = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};

  b {
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral950};
  }
`;

const Amount = styled.span`
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
  white-space: nowrap;
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const DueText = styled.span<{ $overdue: boolean }>`
  font-size: 13px;
  font-weight: ${({ $overdue }) => ($overdue ? 700 : 600)};
  color: ${({ $overdue, theme }) => ($overdue ? theme.color.danger : theme.color.neutral600)};
`;

const Secondary = styled.div`
  display: flex;
  gap: 4px;
  margin: -4px -8px -8px;

  > * {
    flex: 1;
  }
`;

/** Lugar del cobro: la parte principal en negritas (unidad en casa/bodega, propiedad en el resto). */
export function PlaceText({ payment }: { payment: Payment }) {
  const { primary, separator, secondary } = placeParts(payment.unit.name, payment.property);
  return (
    <>
      <b>{primary}</b>
      {separator}
      {secondary}
    </>
  );
}

type PaymentCardProps = {
  payment: Payment;
  today: string | undefined;
};

/** H-07: cobro en celular. Persona y concepto, importe, estado con fecha, acción principal y secundarias. */
export function PaymentCard({ payment, today }: PaymentCardProps) {
  const overdue = payment.status === 'overdue';
  return (
    <Card>
      <Top>
        <Who>
          <strong>{tenantName(payment.tenant)}</strong>
          <Concept>{paymentConcept(payment)}</Concept>
          <Place>
            <PlaceText payment={payment} />
          </Place>
        </Who>
        <Amount>{formatMoney(payment.amount)}</Amount>
      </Top>
      <Status>
        <StatusBadge status={payment.status} />
        <DueText $overdue={overdue}>{dueLabel(payment, today)}</DueText>
      </Status>
      <RegisterPaymentButton payment={payment} fullWidth />
      <Secondary>
        <PaymentWhatsApp payment={payment} today={today} />
        <ActionLink to={`/cobros/${payment.id}`} state={FROM_LIST_STATE}>
          Ver detalle
        </ActionLink>
      </Secondary>
    </Card>
  );
}
