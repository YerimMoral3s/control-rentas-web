import { useState } from 'react';
import type { Payment } from '@api/payments';
import { Button } from '@components';
import { formatMoney } from '@lib/format';
import { tenantName } from '@lib/paymentText';
import { RegisterPaymentDialog } from './RegisterPaymentDialog';

/** Botón "Registrar pago" con su revisión (Y-04). Solo para cobros Pendientes o Vencidos. */
export function RegisterPaymentButton({
  payment,
  fullWidth,
  variant = 'primary',
  withAmount = false,
}: {
  payment: Payment;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
  /** "Registrar pago de $8,500" (detalle del cobro). */
  withAmount?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        fullWidth={fullWidth}
        onClick={() => setOpen(true)}
        aria-label={withAmount ? undefined : `Registrar pago de ${tenantName(payment.tenant)}`}
      >
        {withAmount ? `Registrar pago de ${formatMoney(payment.amount)}` : 'Registrar pago'}
      </Button>
      <RegisterPaymentDialog payment={payment} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
