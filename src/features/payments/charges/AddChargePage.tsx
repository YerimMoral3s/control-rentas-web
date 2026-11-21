import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import type { AdditionalChargeCreationPreview, AdditionalChargeInput } from '@api/payments';
import { isAppError } from '@api/errors';
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
import { useCreateAdditionalCharge, usePreviewAdditionalCharge } from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { placeName } from '@lib/place';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import { chargeFieldMessages, conceptRules } from './chargeRules';

type Stage = 'datos' | 'revisar';

const STAGES = [
  { key: 'datos', label: 'Cargo' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

type Values = { concept_reference: string; amount: string; due_date: string };

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
    overflow-wrap: anywhere;
  }
`;

const Note = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_MESSAGES: Record<string, string> = {
  CONTRACT_NOT_ACTIVE: 'Este contrato ya no está Activo: solo un contrato Activo recibe cargos.',
  PAYMENT_OPERATION_CONFLICT: 'Otra operación está cambiando este contrato. Revisa el contrato.',
};

function AddChargeForm({ contract }: { contract: Contract }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const previewMutation = usePreviewAdditionalCharge();
  const create = useCreateAdditionalCharge();
  const [stage, setStage] = useState<Stage>('datos');
  const [preview, setPreview] = useState<AdditionalChargeCreationPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { concept_reference: '', amount: '', due_date: '' } });
  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;
  const place = placeName(contract.unit.name, contract.property);
  const detail = `/contratos/${contract.id}`;

  const toInput = (values: Values): AdditionalChargeInput => ({
    contract_id: contract.id,
    concept_reference: values.concept_reference.trim(),
    amount: toAmount(values.amount),
    due_date: values.due_date,
  });

  const failureOf = (error: unknown, notSaved: string) => {
    const result = setupFailure(error, notSaved, false);
    if (result.tone === 'error' && isAppError(error) && CODE_MESSAGES[error.code])
      return { ...result, body: CODE_MESSAGES[error.code] };
    if (result.tone === 'uncertain')
      return {
        ...result,
        title: 'No sabemos si se agregó el cargo',
        body: 'Revisa el contrato antes de volver a intentarlo, para no agregarlo dos veces.',
      };
    return result;
  };

  const requestReview = handleSubmit(async values => {
    setFailure(null);
    setChanged(false);
    try {
      const { data } = await previewMutation.mutateAsync(toInput(values));
      setPreview(data);
      setStage('revisar');
    } catch (error) {
      if (applyFieldErrors(error, setError, chargeFieldMessages)) return;
      setFailure(failureOf(error, 'No pudimos revisar el cargo.'));
    }
  });

  const save = () => {
    if (!preview) return;
    setFailure(null);
    create.mutate(
      { ...toInput(getValues()), preview_token: preview.preview_token },
      {
        onSuccess: ({ data }) => {
          void navigate(`/cobros/${data.id}`, {
            replace: true,
            state: withResult({
              title: 'Cargo agregado',
              body: `${data.concept_reference ?? preview.after.concept_reference} quedó ${data.status === 'overdue' ? 'Vencido' : 'Pendiente'} en el contrato de ${name}. Su pago se registra aparte.`,
            }),
          });
          void events.paymentChanged();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setPreview(error.details.preview as AdditionalChargeCreationPreview);
            setChanged(true);
            return;
          }
          // Los errores de campo regresan al formulario, junto a su campo.
          if (applyFieldErrors(error, setError, chargeFieldMessages)) {
            setStage('datos');
            return;
          }
          setFailure(failureOf(error, 'No pudimos agregar el cargo.'));
        },
      },
    );
  };

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    datos: { label: 'Cancelar', onClick: () => void navigate(detail) },
    revisar: { label: 'Cargo', onClick: () => setStage('datos') },
  };

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ datos: stage === 'revisar' }}
      title="Agregar cargo"
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
            <Note>{contractKindLine(contract)} · Activo</Note>
            <TextField
              label="Concepto"
              autoComplete="off"
              placeholder="Por ejemplo, Recibo de luz septiembre"
              maxLength={150}
              error={errors.concept_reference?.message}
              {...register('concept_reference', conceptRules)}
            />
            <TextField
              label="Importe"
              format="money"
              prefix="$"
              autoComplete="off"
              error={errors.amount?.message}
              {...register('amount', {
                validate: value => toAmount(value) > 0 || 'Escribe un importe mayor a cero.',
              })}
            />
            <TextField
              label="Vencimiento"
              type="date"
              help="Puede ser una fecha pasada, de hoy o futura."
              error={errors.due_date?.message}
              {...register('due_date', {
                validate: value =>
                  /^\d{4}-\d{2}-\d{2}$/.test(value) || 'Elige la fecha de vencimiento.',
              })}
            />
            <StickyStepFooter>
              <Button
                onClick={() => void requestReview()}
                loading={previewMutation.isPending}
                loadingLabel="Revisando…"
              >
                Revisar cargo
              </Button>
            </StickyStepFooter>
          </>
        ) : preview ? (
          <>
            <StepIntro>
              <h2>Revisa el cargo</h2>
              <p>{place}</p>
            </StepIntro>
            {changed ? (
              <Notice tone="warning" title="La revisión cambió">
                Algo cambió mientras revisabas. Revisa el cargo otra vez y confírmalo de nuevo.
              </Notice>
            ) : null}
            <Facts>
              <div>
                <dt>Se cobrará a</dt>
                <dd>{name}</dd>
              </div>
              <div>
                <dt>Contrato</dt>
                <dd>{contractKindLine(contract)}</dd>
              </div>
              <div>
                <dt>Concepto</dt>
                <dd>{preview.after.concept_reference}</dd>
              </div>
              <div>
                <dt>Importe</dt>
                <dd>{formatMoney(preview.after.amount)}</dd>
              </div>
              <div>
                <dt>Vencimiento</dt>
                <dd>{formatDateWithYear(preview.after.due_date)}</dd>
              </div>
              <div>
                <dt>Al crearlo</dt>
                <dd>
                  <StatusBadge status={preview.after.status} compact />
                </dd>
              </div>
            </Facts>
            <Note>Agregar el cargo no registra su pago. Lo registrarás después, en el cobro.</Note>
            <StickyStepFooter>
              {failure?.tone === 'uncertain' ? (
                <ButtonLink to={detail}>Ver contrato</ButtonLink>
              ) : (
                <Button onClick={save} loading={create.isPending} loadingLabel="Guardando…">
                  Agregar cargo de {formatMoney(preview.after.amount)}
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

/** Y-11: agregar un cargo adicional a un contrato actual Activo. */
export function AddChargePage() {
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
  if (!contract.is_current || contract.status !== 'active')
    return <Navigate to={`/contratos/${contract.id}`} replace />;
  return <AddChargeForm contract={contract} />;
}
