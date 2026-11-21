import styled from 'styled-components';
import type { Payment } from '@api/payments';
import { actionLinkStyle, Icon } from '@components';
import { whatsappUrl } from '@lib/whatsapp';
import { tenantName, whatsappMessage } from '@lib/paymentText';

const WhatsAppLink = styled.a`
  ${actionLinkStyle}
`;

type PaymentActionProps = {
  payment: Payment;
  today: string | undefined;
};

/** WhatsApp abre la conversación con un mensaje precargado; nunca envía ni registra nada. */
export function PaymentWhatsApp({ payment, today }: PaymentActionProps) {
  return (
    <WhatsAppLink
      href={whatsappUrl(payment.tenant.phone, whatsappMessage(payment, today))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir WhatsApp para ${tenantName(payment.tenant)}`}
    >
      <Icon name="whatsapp" size={18} />
      WhatsApp
    </WhatsAppLink>
  );
}

export { RegisterPaymentButton } from '@features/payments/actions/RegisterPaymentButton';
