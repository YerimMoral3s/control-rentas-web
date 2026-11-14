import styled from 'styled-components';
import type { CreationPreview } from '@api/contracts';
import { Button, Notice, StatusBadge } from '@components';
import { contractKindLine } from '@features/contracts/contractText';
import { formatDateRange, formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney, formatPhone } from '@lib/format';
import { media } from '@styles/theme';
import { StepFooter, StepIntro } from '../components/stepStyles';
import { dueText, groupRents, rentTitle } from '../currentRentText';

const Columns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.wide} {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
`;

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  h3 {
    margin: 0;
    font-size: 16px;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Facts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px 16px;
  font-size: 15px;

  dt {
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
`;

const Charge = styled.li`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  strong {
    font-size: 15px;
  }

  b {
    text-align: right;
    font-size: 15px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  > span:last-child {
    justify-self: end;
  }
`;

const Charges = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

type RentReviewProps = {
  preview: CreationPreview;
  tenantPhone: string | null;
  /** 409 PREVIEW_CHANGED: la revisión se actualizó y hay que confirmar de nuevo. */
  changed: boolean;
  failure: { title: string; body?: string; tone: 'error' | 'uncertain'; requestId?: string } | null;
  saving: boolean;
  onSave: () => void;
  onChangeTenant: () => void;
  onChangeData: () => void;
};

/**
 * P-10 · Revisar: lo que devolvió el servidor (estado, cobros y depósito). Esta revisión es la
 * confirmación; Guardar usa su token y nunca se reenvía solo.
 */
export function RentReview({
  preview,
  tenantPhone,
  changed,
  failure,
  saving,
  onSave,
  onChangeTenant,
  onChangeData,
}: RentReviewProps) {
  const { contract, tenant, unit, deposit, new_rents: rents } = preview;
  const name = `${tenant.first_name} ${tenant.last_name}`;
  const expired = contract.status === 'expired';
  const { single, group } = groupRents(rents);
  const [year, month] = preview.operational_date.split('-').map(Number) as [number, number];
  const currentMonth = monthName(year, month);

  return (
    <>
      <StepIntro>
        <h2>Revisa la renta actual</h2>
        <p>
          {unit.name} · {unit.property.name}
        </p>
      </StepIntro>
      {changed ? (
        <Notice tone="warning" title="La revisión cambió">
          Actualizamos los cobros con la información de hoy. Revísalos y guarda otra vez.
        </Notice>
      ) : null}
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <Columns>
        <Block>
          <header>
            <h3>Inquilino</h3>
            <Button variant="tertiary" onClick={onChangeTenant} disabled={saving}>
              Cambiar
            </Button>
          </header>
          <Facts>
            <dt>Nombre</dt>
            <dd>{name}</dd>
            {tenantPhone ? (
              <>
                <dt>Teléfono</dt>
                <dd>{formatPhone(tenantPhone)}</dd>
              </>
            ) : null}
          </Facts>
        </Block>
        <Block>
          <header>
            <h3>Datos del contrato</h3>
            <Button variant="tertiary" onClick={onChangeData} disabled={saving}>
              Cambiar datos
            </Button>
          </header>
          <Facts>
            <dt>Contrato</dt>
            <dd>{contractKindLine(contract)}</dd>
            <dt>Fechas</dt>
            <dd>{formatDateRange(contract.start_date, contract.end_date)}</dd>
            <dt>Estado</dt>
            <dd>
              <StatusBadge status={contract.status} compact />
            </dd>
            <dt>Renta mensual</dt>
            <dd>{formatMoney(contract.rent_amount)}</dd>
            <dt>Día de pago</dt>
            <dd>{contract.fixed_due_day} de cada mes</dd>
          </Facts>
        </Block>
        {deposit ? (
          <Block>
            <h3>Depósito anterior</h3>
            <Facts>
              <dt>Importe</dt>
              <dd>{formatMoney(deposit.amount)}</dd>
              <dt>Estado</dt>
              <dd>
                <StatusBadge status={deposit.status} compact />
              </dd>
            </Facts>
            <p>
              Se registrará como Pendiente. Después podrás registrar su pago si ya fue recibido.
            </p>
          </Block>
        ) : null}
        <Block>
          <h3>Cobros que se crearán · {preview.summary.new_rents}</h3>
          {expired && rents.length === 0 ? (
            <Notice tone="warning" title={`Venció el ${formatDateWithYear(contract.end_date)}`}>
              {name} sigue rentando; la unidad quedará Ocupada. No se crean cobros porque su fecha
              de término ya pasó. Después podrás usar Agregar renta o Continuar contrato desde el
              contrato.
            </Notice>
          ) : (
            <>
              <Charges>
                {single.map(rent => (
                  <Charge key={rent.period_key}>
                    <strong>{rentTitle(rent.period_key)}</strong>
                    <b>{formatMoney(rent.amount)}</b>
                    <small>{dueText(rent)}</small>
                    <span>
                      <StatusBadge status={rent.status} compact />
                    </span>
                  </Charge>
                ))}
                {group ? (
                  <Charge>
                    <strong>
                      {group.count} rentas · {group.range}
                    </strong>
                    <b>{formatMoney(group.amount)} cada una</b>
                    <small>Vencen el día {contract.fixed_due_day}</small>
                    <span>
                      <StatusBadge status="pending" compact />
                    </span>
                  </Charge>
                ) : null}
              </Charges>
              <p>
                Empiezan en {currentMonth}, el mes en que la registras. No se agregan meses
                anteriores. Si ya te pagó {currentMonth}, registra el pago después desde el cobro.
              </p>
            </>
          )}
        </Block>
      </Columns>
      <StepFooter>
        <Button onClick={onSave} loading={saving} disabled={failure?.tone === 'uncertain'}>
          Guardar renta actual
        </Button>
        <Button variant="secondary" onClick={onChangeData} disabled={saving}>
          Cambiar datos
        </Button>
      </StepFooter>
    </>
  );
}
