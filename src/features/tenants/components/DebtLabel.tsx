import styled from 'styled-components';
import type { Tenant } from '@api/tenants';
import { Icon } from '@components';
import { formatMoney } from '@lib/format';
import { hasOverdueDebt } from '../tenantText';

const Debt = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.danger};
`;

const NoDebt = styled.span`
  font-size: 15px;
  color: ${({ theme }) => theme.color.neutral600};
`;

/** "Pagos atrasados" de un inquilino: el total del backend o "Sin pagos atrasados". */
export function DebtLabel({ tenant, small = false }: { tenant: Tenant; small?: boolean }) {
  const style = small ? { fontSize: 13 } : undefined;
  if (!hasOverdueDebt(tenant)) return <NoDebt style={style}>Sin pagos atrasados</NoDebt>;
  return (
    <Debt style={style} aria-label={`Pagos atrasados: ${formatMoney(tenant.overdue_debt.amount)}`}>
      <Icon name="alert" size={16} strokeWidth={2.4} />
      {formatMoney(tenant.overdue_debt.amount)}
    </Debt>
  );
}
