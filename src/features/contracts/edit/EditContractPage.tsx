import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { ConditionsInput, ConditionsPreview, Contract } from '@api/contracts';
import {
  Button,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  StatusBadge,
  TextField,
} from '@components';
import { SetupLayout } from '@features/properties/setup/components/SetupLayout';
import {
  StickyStepFooter,
  StepIntro,
  StepPanel,
} from '@features/properties/setup/components/stepStyles';
import { setupFailure, type SetupFailure } from '@features/properties/setup/setupFailure';
import { useContract, usePreviewConditions, useUpdateContract } from '@hooks/querys/contracts';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { formatMoneyInput } from '@lib/numericInput';
import { withResult } from '@lib/useResultNotice';
import { media, theme as tokens } from '@styles/theme';
import { contractKindLine } from '../contractText';
import { dueText, rentTitle } from '../form/contractPreviewText';
import { toAmount } from '../form/ContractFields';
import { unitLabel } from '../form/UnitPicker';

type Stage = 'cambios' | 'revisar';

const STAGES = [
  { key: 'cambios', label: 'Cambios' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

type Values = { rent_amount: string; fixed_due_day: string };

const Grid = styled.div`
  display: grid;
  gap: 20px;

  ${media.table} {
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
  }
`;

const Facts = styled.dl`
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
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral700};
  }
`;

const Changes = styled.ul`
  && {
    padding: 0;
    list-style: none;
  }

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
`;

const tenantName = (contract: Contract) =>
  `${contract.tenant.first_name} ${contract.tenant.last_name}`;

const CODE_MESSAGES: Record<string, string> = {
  CONTRACT_NOT_CURRENT: 'Este contrato ya no es el contrato actual: no se puede editar.',
  INVALID_FIXED_DUE_DAY: 'Escribe un día de pago del 1 al 31.',
};

const failureOf = (error: unknown, notSaved: string, marked: boolean): SetupFailure => {
  const result = setupFailure(error, notSaved, marked);
  if (result.tone === 'error' && !marked && isAppError(error) && CODE_MESSAGES[error.code])
    return { ...result, body: `${CODE_MESSAGES[error.code]} Tus cambios siguen aquí.` };
  return result;
};

function EditForm({ contract }: { contract: Contract }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const previewMutation = usePreviewConditions();
  const update = useUpdateContract();
  const [stage, setStage] = useState<Stage>('cambios');
  const [preview, setPreview] = useState<ConditionsPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: {
      rent_amount: formatMoneyInput(contract.rent_amount),
      fixed_due_day: String(contract.fixed_due_day),
    },
  });
  const name = tenantName(contract);
  const place = unitLabel({ name: contract.unit.name, property: contract.property });
  const detail = `/contratos/${contract.id}`;

  /** Solo lo que cambió (al menos uno). */
  const changesOf = (values: Values): ConditionsInput => {
    const changes: ConditionsInput = {};
    const rent = toAmount(values.rent_amount);
    if (rent !== Number(contract.rent_amount)) changes.rent_amount = rent;
    if (Number(values.fixed_due_day) !== contract.fixed_due_day)
      changes.fixed_due_day = Number(values.fixed_due_day);
    return changes;
  };

  const requestReview = handleSubmit(async values => {
    setFailure(null);
    setChanged(false);
    const changes = changesOf(values);
    if (Object.keys(changes).length === 0) {
      setFailure({
        tone: 'error',
        title: 'No hay cambios',
        body: 'Cambia la renta o el día de pago.',
      });
      return;
    }
    try {
      const { data } = await previewMutation.mutateAsync({ contractId: contract.id, changes });
      setPreview(data);
      setStage('revisar');
    } catch (error) {
      const marked = applyFieldErrors(error, setError, {
        rent_amount: 'Revisa la renta mensual.',
        fixed_due_day: 'Escribe un día del 1 al 31.',
      });
      setFailure(failureOf(error, 'No pudimos revisar los cambios.', marked));
    }
  });

  const save = async () => {
    if (!preview) return;
    setFailure(null);
    try {
      const { data } = await update.mutateAsync({
        contractId: contract.id,
        changes: changesOf(getValues()),
        previewToken: preview.preview_token,
      });
      const summary = data.update_summary;
      void navigate(detail, {
        replace: true,
        state: withResult({
          title: 'Guardamos los cambios del contrato',
          body:
            summary.changed_rents > 0
              ? `${summary.changed_rents} ${summary.changed_rents === 1 ? 'renta ahora es' : 'rentas ahora son'} de ${formatMoney(data.rent_amount)} y ${summary.changed_rents === 1 ? 'vence' : 'vencen'} el día ${data.fixed_due_day}.`
              : 'No había rentas Pendientes que cambiar.',
        }),
      });
      void events.contractUpdated();
    } catch (error) {
      if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
        // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
        setPreview(error.details.preview as ConditionsPreview);
        setChanged(true);
        return;
      }
      const result = failureOf(error, 'No pudimos guardar los cambios', false);
      setFailure(
        result.tone === 'uncertain'
          ? {
              ...result,
              title: 'No sabemos si se guardaron los cambios',
              body: 'Revisa el contrato antes de intentarlo otra vez, para no repetirlos.',
            }
          : result,
      );
    }
  };

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    cambios: { label: 'Cancelar', onClick: () => void navigate(detail) },
    revisar: { label: 'Cambios', onClick: () => setStage('cambios') },
  };

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ cambios: stage === 'revisar' }}
      title="Editar contrato"
      subtitle={`${name} · ${place}`}
      back={backs[stage]}
      saving={update.isPending}
    >
      <StepPanel>
        {failure ? (
          <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
            {failure.body}
          </Notice>
        ) : null}
        {stage === 'cambios' ? (
          <>
            <div>
              <StatusBadge status={contract.status} compact />
            </div>
            <Grid>
              <TextField
                label="Renta mensual"
                format="money"
                prefix="$"
                autoComplete="off"
                help={`Ahora: ${formatMoney(contract.rent_amount)}`}
                disabled={previewMutation.isPending}
                error={errors.rent_amount?.message}
                {...register('rent_amount', {
                  validate: value => toAmount(value) > 0 || 'Escribe la renta mensual.',
                })}
              />
              <TextField
                label="Día de pago"
                help={`Día del mes en que vence la renta. Ahora: día ${contract.fixed_due_day}`}
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
            <Section>
              <h3>No se pueden cambiar</h3>
              <Facts>
                <dt>Contrato</dt>
                <dd>{contractKindLine(contract)}</dd>
                <dt>Fecha de inicio</dt>
                <dd>{formatDateWithYear(contract.start_date)}</dd>
                <dt>Fecha final</dt>
                <dd>{formatDateWithYear(contract.end_date)}</dd>
                <dt>Inquilino</dt>
                <dd>{name}</dd>
                <dt>Unidad</dt>
                <dd>{place}</dd>
              </Facts>
            </Section>
            <StickyStepFooter>
              <Button
                onClick={() => void requestReview()}
                loading={previewMutation.isPending}
                loadingLabel="Revisando…"
              >
                Revisar cambios
              </Button>
            </StickyStepFooter>
          </>
        ) : preview ? (
          <>
            <StepIntro>
              <h2>Revisa los cambios</h2>
              <p>
                Contrato de {name} · {place}
              </p>
            </StepIntro>
            {changed ? (
              <Notice tone="warning" title="La revisión cambió">
                Algo cambió mientras revisabas. Revisa las rentas otra vez y guarda de nuevo.
              </Notice>
            ) : null}
            <Facts>
              <dt>Renta mensual</dt>
              <dd>
                {formatMoney(preview.conditions.before.rent_amount)} →{' '}
                {formatMoney(preview.conditions.after.rent_amount)}
              </dd>
              <dt>Día de pago</dt>
              <dd>
                Día {preview.conditions.before.fixed_due_day} → Día{' '}
                {preview.conditions.after.fixed_due_day}
              </dd>
            </Facts>
            <Section>
              <h3>No cambian</h3>
              <ul>
                <li>Rentas que ya vencieron, Pagadas o Canceladas.</li>
                <li>Cargos adicionales.</li>
                <li>Fechas y duración del contrato.</li>
                <li>Depósito.</li>
              </ul>
            </Section>
            <Section>
              <h3>
                {preview.summary.changed_rents === 0
                  ? 'No cambia ninguna renta'
                  : preview.summary.changed_rents === 1
                    ? 'Cambiará 1 renta Pendiente'
                    : `Cambiarán ${preview.summary.changed_rents} rentas Pendientes`}
              </h3>
              {preview.changed_rents.length > 0 ? (
                <Changes>
                  {preview.changed_rents.map(rent => (
                    <li key={rent.id}>
                      <strong>{rentTitle(rent.period_key)}</strong>
                      <b>{formatMoney(rent.after.amount)}</b>
                      <small>
                        {dueText(
                          {
                            due_date: rent.after.due_date,
                            status: rent.after.status === 'overdue' ? 'overdue' : 'pending',
                          },
                          preview.operational_date,
                        )}
                      </small>
                      <small>
                        Antes: {formatMoney(rent.before.amount)}, el día{' '}
                        {Number(rent.before.due_date.slice(8))}
                      </small>
                    </li>
                  ))}
                </Changes>
              ) : (
                <ul>
                  <li>Solo cambian las condiciones del contrato para lo que se agregue después.</li>
                </ul>
              )}
            </Section>
            <StickyStepFooter>
              <Button
                onClick={() => void save()}
                loading={update.isPending}
                disabled={failure?.tone === 'uncertain'}
              >
                Guardar cambios
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStage('cambios')}
                disabled={update.isPending}
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

/** C-15 / C-16: editar renta y día de pago del contrato actual (Activo o Vencido). */
export function EditContractPage() {
  const { contractId } = useParams();
  const query = useContract(contractId);

  if (query.isPending) return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
  if (query.isError)
    return (
      <>
        <ReturnLink to={`/contratos/${contractId ?? ''}`} label="Contrato" />
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos este contrato" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </>
    );
  const contract = query.data.data;
  if (!contract.is_current || contract.status === 'terminated')
    return <Navigate to={`/contratos/${contract.id}`} replace />;
  return <EditForm contract={contract} />;
}
