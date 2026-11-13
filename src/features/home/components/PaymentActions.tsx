import styled from 'styled-components';
import type { Payment } from '@api/payments';
import { actionLinkStyle, Button, Icon } from '@components';
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

/** Registrar pago se conecta en la fase 6; mientras tanto se muestra deshabilitado, sin simular. */
export function RegisterPaymentButton({
  payment,
  fullWidth,
}: {
  payment: Payment;
  fullWidth?: boolean;
}) {
  return (
    <Button
      fullWidth={fullWidth}
      disabled
      title="Disponible próximamente"
      aria-label={`Registrar pago de ${tenantName(payment.tenant)}`}
    >
      Registrar pago
    </Button>
  );
}
