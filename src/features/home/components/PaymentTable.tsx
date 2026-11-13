import styled from 'styled-components';
import type { Payment } from '@api/payments';
import { ActionLink, FROM_LIST_STATE, StatusBadge } from '@components';
import { formatMoney } from '@lib/format';
import { dueLabel, paymentConcept, tenantName } from '@lib/paymentText';
import { PaymentWhatsApp, RegisterPaymentButton } from './PaymentActions';
import { DueText, PlaceText } from './PaymentCard';

const COLUMNS = 'minmax(0, 1.2fr) minmax(0, 1fr) 150px 100px auto';

export const Table = styled.div`
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
  overflow: hidden;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }
`;

const Header = styled(Row)`
  background: ${({ theme }) => theme.color.neutral50};
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Who = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;

  strong {
    font-size: 16px;
    line-height: 22px;
  }

  span {
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Place = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};

  b {
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral950};
  }
`;

const Due = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
`;

const Amount = styled.span`
  font-size: 16px;
  font-weight: 700;
  text-align: right;
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  button {
    height: ${({ theme }) => theme.size.touch};
    padding: 0 16px;
  }
`;

export function PaymentTableHeader() {
  return (
    <Header role="row">
      <span role="columnheader">Inquilino y concepto</span>
      <span role="columnheader">Propiedad y unidad</span>
      <span role="columnheader">Vencimiento y estado</span>
      <span role="columnheader" style={{ textAlign: 'right' }}>
        Importe
      </span>
      <span role="columnheader">Acciones</span>
    </Header>
  );
}

type PaymentRowProps = {
  payment: Payment;
  today: string | undefined;
};

/** H-08: cobro en computadora, misma información y acciones que la tarjeta. */
export function PaymentRow({ payment, today }: PaymentRowProps) {
  return (
    <Row role="row">
      <Who role="cell">
        <strong>{tenantName(payment.tenant)}</strong>
        <span>{paymentConcept(payment)}</span>
      </Who>
      <Place role="cell">
        <PlaceText payment={payment} />
      </Place>
      <Due role="cell">
        <StatusBadge status={payment.status} compact />
        <DueText $overdue={payment.status === 'overdue'}>{dueLabel(payment, today)}</DueText>
      </Due>
      <Amount role="cell">{formatMoney(payment.amount)}</Amount>
      <Actions role="cell">
        <RegisterPaymentButton payment={payment} />
        <PaymentWhatsApp payment={payment} today={today} />
        <ActionLink to={`/cobros/${payment.id}`} state={FROM_LIST_STATE}>
          Ver detalle
        </ActionLink>
      </Actions>
    </Row>
  );
}
