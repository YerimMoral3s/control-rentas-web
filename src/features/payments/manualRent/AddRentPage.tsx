import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import { isAppError } from '@api/errors';
import type {
  ManualRentInput,
  ManualRentPeriods,
  ManualRentPreview,
  PaymentStatus,
} from '@api/payments';
import {
  Button,
  ButtonLink,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  StatusBadge,
  TextField,
} from '@components';
import { contractKindLine } from '@features/contracts/contractText';
import { toAmount } from '@features/contracts/form/ContractFields';
import { SetupLayout } from '@features/properties/setup/components/SetupLayout';
import {
  StepIntro,
  StepPanel,
  StickyStepFooter,
} from '@features/properties/setup/components/stepStyles';
import { setupFailure, type SetupFailure } from '@features/properties/setup/setupFailure';
import { useContract } from '@hooks/querys/contracts';
import {
  useManualRentPeriods,
  useCreateManualRent,
  usePreviewManualRent,
} from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { formatMoneyInput } from '@lib/numericInput';
import { shortPlaceName } from '@lib/place';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';

type Stage = 'datos' | 'revisar';

const STAGES = [
  { key: 'datos', label: 'Renta' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

type Values = { period: string; amount: string };
type PeriodsData = ManualRentPeriods;

const Facts = styled.dl`
  margin: 0;
  padding: 4px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  div {
    padding: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
  }
`;

const Note = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** Lista de meses (Y-06): radios nativos, los que ya tienen renta deshabilitados. */
const Periods = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  legend {
    margin-bottom: 6px;
    padding: 0;
    font-size: 15px;
    font-weight: 600;
  }
`;

const Period = styled.label<{ $selected: boolean; $disabled: boolean }>`
  position: relative;
  min-height: 52px;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-radius: ${({ theme }) => theme.radius.control};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral300)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none'};
  background: ${({ $selected, $disabled, theme }) =>
    $selected ? theme.color.primary100 : $disabled ? theme.color.neutral50 : theme.color.white};
  color: ${({ $disabled, theme }) => ($disabled ? theme.color.neutral600 : theme.color.neutral950)};
  font-size: 15px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};

  small {
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.color.neutral600};
    text-align: right;
  }

  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }
`;

const STATUS_WORD: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  overdue: 'Vencido',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

/** "2026-10" → "Octubre 2026" */
const monthTitle = (period: string) => {
  const name = monthName(Number(period.slice(0, 4)), Number(period.slice(5, 7)));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${period.slice(0, 4)}`;
};

const CODE_MESSAGES: Record<string, string> = {
  MANUAL_RENT_PERIOD_NOT_ALLOWED:
    'Ese mes no se puede agregar. Elige un mes posterior al final del contrato y que no sea posterior al mes actual.',
  MANUAL_RENT_CONTRACT_NOT_ELIGIBLE:
    'Este contrato ya no permite agregar rentas: ya no es el contrato actual Vencido.',
  DUPLICATE_PAYMENT_PERIOD_KEY: 'Ese mes ya tiene una renta en este contrato. No creamos otra.',
  PAYMENT_OPERATION_CONFLICT: 'Otra operación está cambiando este contrato. Revisa el contrato.',
};

const failureOf = (error: unknown, notSaved: string, marked: boolean): SetupFailure => {
  const result = setupFailure(error, notSaved, marked);
  if (result.tone === 'error' && !marked && isAppError(error) && CODE_MESSAGES[error.code])
    return { ...result, body: CODE_MESSAGES[error.code] };
  if (result.tone === 'uncertain')
    return {
      ...result,
      title: 'No sabemos si se agregó la renta',
      body: 'Revisa el contrato antes de volver a intentarlo.',
    };
  return result;
};

function AddRentForm({ contract, periods }: { contract: Contract; periods: PeriodsData }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const previewMutation = usePreviewManualRent();
  const create = useCreateManualRent();
  const [stage, setStage] = useState<Stage>('datos');
  const [preview, setPreview] = useState<ManualRentPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    control,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: {
      // El último mes que se puede agregar (normalmente el actual).
      period: periods.periods.filter(item => item.can_create).at(-1)?.period_key ?? '',
      amount: formatMoneyInput(periods.contract.rent_amount),
    },
  });
  const selectedPeriod = useWatch({ control, name: 'period' });
  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;
  const place = shortPlaceName(contract.unit.name, contract.property);
  const detail = `/contratos/${contract.id}`;

  const toInput = (values: Values): ManualRentInput => ({
    contract_id: contract.id,
    period_year: Number(values.period.slice(0, 4)),
    period_month: Number(values.period.slice(5, 7)),
    amount: toAmount(values.amount),
  });

  const requestReview = handleSubmit(async values => {
    setFailure(null);
    setChanged(false);
    try {
      const { data } = await previewMutation.mutateAsync(toInput(values));
      setPreview(data);
      setStage('revisar');
    } catch (error) {
      const marked = applyFieldErrors(error, setError, {
        amount: 'Escribe un importe mayor a cero.',
      });
      setFailure(failureOf(error, 'No pudimos revisar la renta.', marked));
    }
  });

  const save = async () => {
    if (!preview) return;
    setFailure(null);
    try {
      const { data } = await create.mutateAsync({
        ...toInput(getValues()),
        preview_token: preview.preview_token,
      });
      void navigate(`/cobros/${data.id}`, {
        replace: true,
        state: withResult({
          title: `Agregamos la renta de ${monthName(Number(data.period_key.slice(0, 4)), Number(data.period_key.slice(5, 7)))}`,
          body: `${name} · ${place}. Quedó ${data.status === 'overdue' ? 'Vencida' : 'Pendiente'}; su pago se registra aparte.`,
        }),
      });
      void events.paymentChanged();
    } catch (error) {
      if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
        // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
        setPreview(error.details.preview as ManualRentPreview);
        setChanged(true);
        return;
      }
      setFailure(failureOf(error, 'No pudimos agregar la renta.', false));
    }
  };

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    datos: { label: 'Cancelar', onClick: () => void navigate(detail) },
    revisar: { label: 'Renta', onClick: () => setStage('datos') },
  };

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ datos: stage === 'revisar' }}
      title="Agregar renta"
      subtitle={`${name} · ${place}`}
      back={backs[stage]}
      saving={create.isPending}
    >
      <StepPanel>
        {failure ? (
          <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
            {failure.body}
          </Notice>
        ) : null}
        {stage === 'datos' ? (
          <>
            <Notice tone="info" title={`${name} sigue rentando ${place}`}>
              {contractKindLine(contract)}. El contrato está Vencido y sigue siendo el actual.
            </Notice>
            {periods.periods.length === 0 ? (
              <Notice tone="info" title="Todavía no hay meses para agregar">
                El contrato venció este mes. Podrás agregar la renta del mes siguiente cuando
                empiece.
              </Notice>
            ) : (
              <Periods aria-invalid={Boolean(errors.period) || undefined}>
                <legend>Mes de la renta</legend>
                {periods.periods.map(item => {
                  const existing =
                    item.existing_rents.find(rent => rent.contract.id === contract.id) ??
                    item.existing_rents[0];
                  const disabled = !item.can_create || previewMutation.isPending;
                  const note = !item.can_create
                    ? existing
                      ? `Ya existe · ${STATUS_WORD[existing.status]}`
                      : 'No disponible'
                    : item.period_key === periods.to_period
                      ? 'Mes actual'
                      : '';
                  return (
                    <Period
                      key={item.period_key}
                      $selected={selectedPeriod === item.period_key}
                      $disabled={!item.can_create}
                    >
                      <input
                        type="radio"
                        className="visually-hidden"
                        value={item.period_key}
                        disabled={disabled}
                        {...register('period', { required: 'Elige el mes de la renta.' })}
                      />
                      {monthTitle(item.period_key)}
                      {note ? <small>{note}</small> : null}
                    </Period>
                  );
                })}
                <Note>
                  Desde {monthTitle(periods.from_period).toLowerCase()}, el mes siguiente al final
                  del contrato, hasta el mes actual.
                </Note>
              </Periods>
            )}
            <TextField
              label="Importe"
              format="money"
              prefix="$"
              autoComplete="off"
              help="Es la renta del contrato. Puedes ajustarla solo para este mes."
              disabled={previewMutation.isPending}
              error={errors.amount?.message}
              {...register('amount', {
                validate: value => toAmount(value) > 0 || 'Escribe un importe mayor a cero.',
              })}
            />
            <Note>
              El vencimiento se calcula con el día de pago del contrato ({contract.fixed_due_day}).
              Agregar la renta no registra su pago; lo registrarás después, en el cobro.
            </Note>
            <StickyStepFooter>
              <Button
                onClick={() => void requestReview()}
                loading={previewMutation.isPending}
                loadingLabel="Revisando…"
                disabled={!selectedPeriod}
              >
                Revisar renta
              </Button>
            </StickyStepFooter>
          </>
        ) : preview ? (
          <>
            <StepIntro>
              <h2>Revisa la renta</h2>
              <p>{place}</p>
            </StepIntro>
            {changed ? (
              <Notice tone="warning" title="La revisión cambió">
                Algo cambió mientras revisabas. Revisa la renta otra vez y confírmala de nuevo.
              </Notice>
            ) : null}
            <Facts>
              <div>
                <dt>Inquilino</dt>
                <dd>{name}</dd>
              </div>
              <div>
                <dt>Contrato</dt>
                <dd>{contractKindLine(contract)}</dd>
              </div>
              <div>
                <dt>Mes</dt>
                <dd>{monthTitle(preview.rent.period_key)}</dd>
              </div>
              <div>
                <dt>Importe</dt>
                <dd>{formatMoney(preview.rent.amount)}</dd>
              </div>
              <div>
                <dt>Vencimiento</dt>
                <dd>{formatDateWithYear(preview.rent.due_date)}</dd>
              </div>
              <div>
                <dt>Al crearla</dt>
                <dd>
                  <StatusBadge status={preview.rent.status} compact />
                </dd>
              </div>
            </Facts>
            <Note>No cambia las fechas del contrato ni agrega meses futuros.</Note>
            <StickyStepFooter>
              {failure?.tone === 'uncertain' ? (
                <ButtonLink to={detail}>Ver contrato</ButtonLink>
              ) : (
                <Button onClick={() => void save()} loading={create.isPending}>
                  Agregar renta de{' '}
                  {monthName(
                    Number(preview.rent.period_key.slice(0, 4)),
                    Number(preview.rent.period_key.slice(5, 7)),
                  )}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setStage('datos')}
                disabled={create.isPending}
              >
                Cambiar datos
              </Button>
            </StickyStepFooter>
          </>
        ) : null}
      </StepPanel>
    </SetupLayout>
  );
}

/** Y-06 / Y-07: agregar renta a un contrato Vencido que sigue siendo el actual. */
export function AddRentPage() {
  const { contractId } = useParams();
  const query = useContract(contractId);
  const current = query.data?.data.is_current && query.data.data.status === 'expired';
  // Meses permitidos del servidor (FE-35); solo para el contrato Vencido actual.
  const periods = useManualRentPeriods(current ? contractId : undefined);

  if (query.isPending || (current && periods.isPending))
    return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
  if (query.isError || periods.isError)
    return (
      <>
        <ReturnLink to={`/contratos/${contractId ?? ''}`} label="Contrato" />
        {query.error?.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos este contrato" />
        ) : (
          <SectionError
            onRetry={() => {
              void query.refetch();
              void periods.refetch();
            }}
            retrying={query.isFetching || periods.isFetching}
          />
        )}
      </>
    );
  const contract = query.data.data;
  if (!current || !periods.data) return <Navigate to={`/contratos/${contract.id}`} replace />;
  return <AddRentForm contract={contract} periods={periods.data.data} />;
}
