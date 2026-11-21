import styled from 'styled-components';
import type { CreatedContract } from '@api/contracts';
import { ButtonLink, Icon, StatusBadge } from '@components';
import { StepPanel } from '@features/properties/setup/components/stepStyles';
import { formatDateRange, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { media, pageTitle } from '@styles/theme';
import { dueText, rentTitle } from '../form/contractPreviewText';
import { unitLabel } from '../form/UnitPicker';
import { contractKindLine } from '../contractText';

const Done = styled(StepPanel)`
  max-width: 640px;
  margin: 0 auto;

  h1 {
    margin: 0;
    ${pageTitle}
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral700};
  }
`;

const Mark = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.successBg};
  color: ${({ theme }) => theme.color.success};
`;

const Box = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid ${({ theme }) => theme.color.neutral200};

  h2 {
    margin: 0;
    font-size: 16px;
  }

  div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Charges = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    padding: 8px 0;
  }

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  strong,
  b {
    font-size: 15px;
  }

  b {
    text-align: right;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${media.table} {
    flex-direction: row;
  }
`;

const period = (key: string) => {
  const [year, month] = key.split('-').map(Number) as [number, number];
  return { name: monthName(year, month), year };
};

type ContractCreatedProps = {
  contract: CreatedContract;
  back: { to: string; label: string };
};

/**
 * C-10: datos guardados (no los de la revisión). La lista larga resume el medio sin ocultar el
 * total ni el último mes.
 */
export function ContractCreated({ contract, back }: ContractCreatedProps) {
  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;
  const rents = contract.created_payments.filter(
    payment => payment.payment_type === 'monthly_rent',
  );
  const summary = contract.generation_summary;
  const head = rents.length > 4 ? rents.slice(0, 3) : rents;
  const last = rents.length > 4 ? rents[rents.length - 1] : undefined;
  const middle = rents.length > 4 ? rents.slice(3, -1) : [];
  const middleText =
    middle.length > 0 && middle[0] && middle[middle.length - 1]
      ? (() => {
          const from = period(middle[0].period_key);
          const to = period(middle[middle.length - 1]!.period_key);
          return `${middle.length} rentas más, de ${from.name}${from.year === to.year ? '' : ` de ${from.year}`} a ${to.name} de ${to.year}`;
        })()
      : null;
  // Año de referencia: el del primer cobro (solo se escribe el año de los que caen en otro).
  const reference = rents[0]?.due_date;
  const rentsText = `${summary.new_rents} ${summary.new_rents === 1 ? 'renta' : 'rentas'}`;
  const depositText =
    summary.new_deposits > 0 ? ` y un depósito de ${formatMoney(summary.new_deposits_amount)}` : '';

  return (
    <Done>
      <Mark aria-hidden="true">
        <Icon name="check" size={26} strokeWidth={2.6} />
      </Mark>
      <h1>
        {name} ya renta {unitLabel({ name: contract.unit.name, property: contract.property })}
      </h1>
      <p>
        Creamos el contrato, {rentsText}
        {depositText}. Registrarás cada pago después.
      </p>
      <Box>
        <div>
          <StatusBadge status={contract.status} compact />
          <small>Contrato actual</small>
        </div>
        <small>
          {contractKindLine(contract)} · {formatDateRange(contract.start_date, contract.end_date)} ·{' '}
          {formatMoney(contract.rent_amount)} al mes
        </small>
      </Box>
      {rents.length > 0 ? (
        <Box>
          <h2>Cobros creados · {summary.new_rents}</h2>
          <Charges>
            {head.map(rent => (
              <li key={rent.id}>
                <strong>{rentTitle(rent.period_key)}</strong>
                <b>{formatMoney(rent.amount)}</b>
                <small>
                  {dueText(
                    {
                      due_date: rent.due_date,
                      status: rent.status === 'overdue' ? 'overdue' : 'pending',
                    },
                    reference,
                  )}
                </small>
                <span>
                  <StatusBadge status={rent.status} compact />
                </span>
              </li>
            ))}
            {middleText ? (
              <li>
                <small>{middleText}</small>
              </li>
            ) : null}
            {last ? (
              <li>
                <strong>{rentTitle(last.period_key)}</strong>
                <b>{formatMoney(last.amount)}</b>
                <small>
                  {dueText(
                    {
                      due_date: last.due_date,
                      status: last.status === 'overdue' ? 'overdue' : 'pending',
                    },
                    reference,
                  )}
                </small>
                <span>
                  <StatusBadge status={last.status} compact />
                </span>
              </li>
            ) : null}
          </Charges>
        </Box>
      ) : null}
      {contract.deposit ? (
        <Box>
          <h2>Depósito</h2>
          <div>
            <b>{formatMoney(contract.deposit.amount)}</b>
            <StatusBadge status={contract.deposit.status} compact />
          </div>
        </Box>
      ) : null}
      <Actions>
        <ButtonLink to={`/contratos/${contract.id}`} replace>
          Ver contrato
        </ButtonLink>
        <ButtonLink variant="secondary" to={back.to} replace>
          {back.label}
        </ButtonLink>
      </Actions>
    </Done>
  );
}
