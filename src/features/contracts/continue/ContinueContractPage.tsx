import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Contract, RenewalPreview, RenewedContract } from '@api/contracts';
import {
  Button,
  ButtonLink,
  Icon,
  Notice,
  OptionGroup,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  StatusBadge,
  TextField,
} from '@components';
import { SetupLayout } from '@features/properties/setup/components/SetupLayout';
import { StepFooter, StepIntro, StepPanel } from '@features/properties/setup/components/stepStyles';
import { setupFailure, type SetupFailure } from '@features/properties/setup/setupFailure';
import {
  useContract,
  useCreateContinuation,
  usePreviewContinuation,
} from '@hooks/querys/contracts';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { contractEndDate, formatDateRange, formatDateWithYear, nextDay } from '@lib/dates';
import { formatMoney, formatPhone } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { formatMoneyInput } from '@lib/numericInput';
import { media, pageTitle, theme as tokens } from '@styles/theme';
import { contractKindLine } from '../contractText';
import { dueText, rentTitle } from '../form/contractPreviewText';
import { toAmount } from '../form/ContractFields';
import { unitLabel } from '../form/UnitPicker';

type Stage = 'condiciones' | 'revisar';

const STAGES = [
  { key: 'condiciones', label: 'Nuevas condiciones' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

type Values = { duration: '6' | '12' | '24'; rent_amount: string; fixed_due_day: string };

const Fixed = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};
  font-size: 15px;

  dt {
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  small {
    display: block;
    font-weight: 400;
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;

  ${media.desktop} {
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
  }
`;

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

const Charges = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    padding: 10px 0;
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

  li > span:last-child {
    justify-self: end;
  }
`;

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

const DoneActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${media.desktop} {
    flex-direction: row;
  }
`;

const CODE_MESSAGES: Record<string, string> = {
  CONTRACT_NOT_CURRENT: 'Este contrato ya no es el contrato actual de la unidad.',
  PREVIOUS_CONTRACT_NOT_ELIGIBLE: 'Este contrato ya no se puede continuar: revisa su estado.',
  RENEWAL_CONTINUITY_CONFLICT: 'Ya existe una continuación de este contrato.',
  INVALID_CONTRACT_DURATION: 'Revisa la duración del contrato.',
  INVALID_FIXED_DUE_DAY: 'Escribe un día de pago del 1 al 31.',
};

const failureOf = (error: unknown, notSaved: string, marked: boolean): SetupFailure => {
  const result = setupFailure(error, notSaved, marked);
  if (result.tone === 'error' && !marked && isAppError(error) && CODE_MESSAGES[error.code])
    return { ...result, body: `${CODE_MESSAGES[error.code]} Lo que escribiste sigue aquí.` };
  return result;
};

const tenantName = (contract: Contract) =>
  `${contract.tenant.first_name} ${contract.tenant.last_name}`;

/** Depósito heredado (Y-15): se conserva del contrato anterior; nunca se cobra de nuevo. */
function InheritedDeposit({ deposit }: { deposit: NonNullable<RenewalPreview['deposit']> }) {
  return (
    <Block>
      <h3>Depósito del contrato anterior</h3>
      <Fixed>
        <dt>Importe</dt>
        <dd>{formatMoney(deposit.amount)}</dd>
        <dt>Estado</dt>
        <dd>
          <StatusBadge status={deposit.status} compact />
        </dd>
        <dt>Devolución</dt>
        <dd>
          {deposit.refund
            ? `${formatMoney(deposit.refund.amount)} el ${formatDateWithYear(deposit.refund.expense_date)}`
            : 'Aún no se ha devuelto'}
        </dd>
      </Fixed>
      <p>Este depósito se conserva del contrato anterior. No se cobra de nuevo.</p>
    </Block>
  );
}

function ContinueForm({ contract }: { contract: Contract }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const previewMutation = usePreviewContinuation();
  const create = useCreateContinuation();
  const [stage, setStage] = useState<Stage>('condiciones');
  const [preview, setPreview] = useState<RenewalPreview | null>(null);
  const [previousCount, setPreviousCount] = useState<number | null>(null);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const [done, setDone] = useState<RenewedContract | null>(null);
  // Se refresca al salir del resultado: antes, el contrato anterior dejaría de ser "actual" y esta
  // pantalla se cerraría sin mostrar C-13.
  const savedRef = useRef(false);
  useEffect(
    () => () => {
      if (savedRef.current) void events.contractCreated(contract.tenant.id);
    },
    [contract.tenant.id, events],
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: {
      duration: String(
        [6, 12, 24].includes(contract.duration_months) ? contract.duration_months : 12,
      ) as Values['duration'],
      rent_amount: formatMoneyInput(contract.rent_amount),
      fixed_due_day: String(contract.fixed_due_day),
    },
  });
  const duration = useWatch({ control, name: 'duration' });
  const name = tenantName(contract);
  const place = unitLabel({ name: contract.unit.name, property: contract.property });
  const start = nextDay(contract.end_date);
  const detail = `/contratos/${contract.id}`;

  const toInput = (values: Values) => ({
    previous_contract_id: contract.id,
    duration_months: Number(values.duration),
    rent_amount: toAmount(values.rent_amount),
    fixed_due_day: Number(values.fixed_due_day),
  });

  const requestReview = handleSubmit(async values => {
    setFailure(null);
    setPreviousCount(null);
    try {
      const { data } = await previewMutation.mutateAsync(toInput(values));
      setPreview(data);
      setStage('revisar');
    } catch (error) {
      const marked = applyFieldErrors(error, setError, {
        rent_amount: 'Revisa la renta mensual.',
        fixed_due_day: 'Escribe un día del 1 al 31.',
      });
      setFailure(failureOf(error, 'No pudimos revisar la continuidad.', marked));
    }
  });

  const confirm = async () => {
    if (!preview) return;
    setFailure(null);
    const input = toInput(getValues());
    try {
      const { data } = await create.mutateAsync({ ...input, preview_token: preview.preview_token });
      savedRef.current = true;
      setDone(data);
    } catch (error) {
      if (isAppError(error) && error.code === 'RENEWAL_PREVIEW_CHANGED') {
        // C-14: nada se guardó. Se pide la revisión nueva y se confirma otra vez.
        try {
          const { data } = await previewMutation.mutateAsync(input);
          setPreviousCount(preview.summary.new_rents);
          setPreview(data);
        } catch (again) {
          setFailure(failureOf(again, 'No pudimos actualizar la revisión.', false));
        }
        return;
      }
      setFailure(failureOf(error, 'No continuamos el contrato.', false));
    }
  };

  if (done) {
    const summary = done.renewal_summary;
    return (
      <Done>
        <Mark aria-hidden="true">
          <Icon name="check" size={26} strokeWidth={2.6} />
        </Mark>
        <h1>
          {name} sigue rentando {place}
        </h1>
        <p>
          Creamos {summary.new_rents} {summary.new_rents === 1 ? 'renta nueva' : 'rentas nuevas'}.
          {summary.covered_months > 0
            ? ` ${summary.covered_months} ${summary.covered_months === 1 ? 'mes ya estaba cubierto' : 'meses ya estaban cubiertos'}.`
            : ''}
          {done.deposit ? ' El depósito se conserva.' : ''}
        </p>
        <Block>
          <h3>Contrato nuevo</h3>
          <Fixed>
            <dt>Estado</dt>
            <dd>
              <StatusBadge status={done.status} compact /> <small>Contrato actual</small>
            </dd>
            <dt>Condiciones</dt>
            <dd>
              {contractKindLine(done)} · {formatDateRange(done.start_date, done.end_date)} ·{' '}
              {formatMoney(done.rent_amount)} al mes
            </dd>
            <dt>Contrato anterior</dt>
            <dd>
              {formatDateRange(contract.start_date, contract.end_date)} ·{' '}
              <Link to={detail}>Ver</Link>
            </dd>
          </Fixed>
          <p>{place} sigue Ocupada, sin pausa.</p>
        </Block>
        <DoneActions>
          <ButtonLink to={`/contratos/${done.id}`} replace>
            Ver contrato
          </ButtonLink>
        </DoneActions>
      </Done>
    );
  }

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    condiciones: { label: 'Cancelar', onClick: () => void navigate(detail) },
    revisar: { label: 'Nuevas condiciones', onClick: () => setStage('condiciones') },
  };
  const values = getValues();

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ condiciones: stage === 'revisar' }}
      title="Continuar contrato"
      subtitle={`${place} · ${name}`}
      back={backs[stage]}
      saving={create.isPending}
    >
      <StepPanel>
        {failure ? (
          <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
            {failure.body}
          </Notice>
        ) : null}
        {stage === 'condiciones' ? (
          <>
            <StepIntro>
              <h2>Continuar contrato</h2>
              <p>
                El contrato de {name} venció el {formatDateWithYear(contract.end_date)}. El nuevo
                empieza al día siguiente.
              </p>
            </StepIntro>
            <Fixed>
              <dt>Inquilino</dt>
              <dd>
                {name}
                <small>{formatPhone(contract.tenant.phone)}</small>
              </dd>
              <dt>Unidad</dt>
              <dd>
                {place}
                <small>Ocupada</small>
              </dd>
              <dt>Tipo</dt>
              <dd>Formal</dd>
              <dt>Fecha de inicio</dt>
              <dd>
                {formatDateWithYear(start)}
                <small>Día siguiente al final del contrato anterior.</small>
              </dd>
            </Fixed>
            <Controller
              control={control}
              name="duration"
              render={({ field }) => (
                <OptionGroup
                  label="Duración"
                  value={field.value}
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                    { value: '24', label: '24 meses' },
                  ]}
                  onChange={field.onChange}
                />
              )}
            />
            <Fixed>
              <dt>Fecha final</dt>
              <dd>
                {formatDateWithYear(contractEndDate(start, Number(duration)))}
                <small>Se calcula con la fecha de inicio y la duración.</small>
              </dd>
            </Fixed>
            <Grid>
              <TextField
                label="Renta mensual"
                format="money"
                prefix="$"
                autoComplete="off"
                help={`Antes: ${formatMoney(contract.rent_amount)}`}
                disabled={previewMutation.isPending}
                error={errors.rent_amount?.message}
                {...register('rent_amount', {
                  validate: value => toAmount(value) > 0 || 'Escribe la renta mensual.',
                })}
              />
              <TextField
                label="Día de pago"
                help="Día del mes en que vence la renta"
                format="digits"
                maxLength={2}
                autoComplete="off"
                disabled={previewMutation.isPending}
                error={errors.fixed_due_day?.message}
                {...register('fixed_due_day', {
                  validate: value =>
                    (/^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 31) ||
                    'Escribe un día del 1 al 31.',
                })}
              />
            </Grid>
            <Notice tone="info" title="No se pide otro depósito.">
              {contract.deposit
                ? `Se conserva el del contrato anterior: ${formatMoney(contract.deposit.amount)}.`
                : 'El contrato anterior no tiene depósito.'}
            </Notice>
            <StepFooter>
              <Button
                onClick={() => void requestReview()}
                loading={previewMutation.isPending}
                loadingLabel="Revisando…"
              >
                Revisar continuidad
              </Button>
            </StepFooter>
          </>
        ) : preview ? (
          <>
            <StepIntro>
              <h2>Revisa la continuidad</h2>
              <p>{place} sigue Ocupada. El contrato anterior queda como contrato anterior.</p>
            </StepIntro>
            {previousCount !== null ? (
              <Notice tone="warning" title="La revisión cambió">
                Algo cambió mientras revisabas: actualizamos los meses cubiertos y los cobros
                nuevos. No guardamos nada todavía. Tus condiciones se conservan: {values.duration}{' '}
                meses, {formatMoney(toAmount(values.rent_amount))}, día {values.fixed_due_day}.
                Revisa otra vez.
              </Notice>
            ) : null}
            <Columns>
              <Block>
                <h3>Datos del contrato nuevo</h3>
                <Fixed>
                  <dt>Inquilino</dt>
                  <dd>{name}</dd>
                  <dt>Unidad</dt>
                  <dd>{place}</dd>
                  <dt>Tipo</dt>
                  <dd>{contractKindLine(preview.contract)}</dd>
                  <dt>Fechas</dt>
                  <dd>{formatDateRange(preview.contract.start_date, preview.contract.end_date)}</dd>
                  <dt>Renta mensual</dt>
                  <dd>{formatMoney(preview.contract.rent_amount)}</dd>
                  <dt>Día de pago</dt>
                  <dd>{preview.contract.fixed_due_day} de cada mes</dd>
                </Fixed>
              </Block>
              <Block>
                <h3>Meses ya cubiertos · {preview.summary.covered_months}</h3>
                {preview.covered_months.length === 0 ? (
                  <p>Ningún mes de las nuevas fechas tiene una renta registrada.</p>
                ) : (
                  <>
                    <Charges>
                      {preview.covered_months.map(item => (
                        <li key={item.period_key}>
                          <strong>{rentTitle(item.period_key)}</strong>
                          <b>{formatMoney(item.payment.amount)}</b>
                          <small>
                            {item.payment.origin_contract.id === contract.id
                              ? 'Contrato anterior'
                              : 'Contrato de origen'}
                          </small>
                          <span>
                            <StatusBadge status={item.payment.status} compact />
                          </span>
                        </li>
                      ))}
                    </Charges>
                    <p>Se quedan en su contrato de origen. No se crean de nuevo.</p>
                  </>
                )}
              </Block>
              <Block>
                <h3>Nuevos cobros · {preview.summary.new_rents}</h3>
                {previousCount !== null && previousCount !== preview.summary.new_rents ? (
                  <p>Antes eran {previousCount}.</p>
                ) : null}
                <Charges>
                  {preview.new_rents.map(rent => (
                    <li key={rent.period_key}>
                      <strong>{rentTitle(rent.period_key)}</strong>
                      <b>{formatMoney(rent.amount)}</b>
                      <small>{dueText(rent, preview.operational_date)}</small>
                      <span>
                        <StatusBadge status={rent.status} compact />
                      </span>
                    </li>
                  ))}
                </Charges>
              </Block>
              {preview.deposit ? <InheritedDeposit deposit={preview.deposit} /> : null}
            </Columns>
            <StepFooter>
              <Button
                onClick={() => void confirm()}
                loading={create.isPending || previewMutation.isPending}
                disabled={failure?.tone === 'uncertain'}
              >
                Continuar contrato
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStage('condiciones')}
                disabled={create.isPending}
              >
                Cambiar condiciones
              </Button>
            </StepFooter>
          </>
        ) : null}
      </StepPanel>
    </SetupLayout>
  );
}

/** C-11 a C-14: Continuar contrato (solo desde un contrato actual Vencido, C-04). */
export function ContinueContractPage() {
  const { contractId } = useParams();
  const query = useContract(contractId);
  const back = <ReturnLink to={`/contratos/${contractId ?? ''}`} label="Contrato" />;

  if (query.isPending) return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
  if (query.isError)
    return (
      <>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos este contrato" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </>
    );
  const contract = query.data.data;
  // Solo un contrato actual Vencido y sin continuación puede continuarse.
  if (contract.status !== 'expired' || !contract.is_current || contract.next_contract)
    return <Navigate to={`/contratos/${contract.id}`} replace />;
  return <ContinueForm contract={contract} />;
}
