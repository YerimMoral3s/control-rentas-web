import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import type { Contract, ContractDeposit } from '@api/contracts';
import { isAppError } from '@api/errors';
import {
  Button,
  ButtonLink,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
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
import { useCreateDepositRefund } from '@hooks/querys/expenses';
import { useAttentionPayments } from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { formatMoneyInput } from '@lib/numericInput';
import { shortPlaceName } from '@lib/place';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';

type Stage = 'importe' | 'revisar';

const STAGES = [
  { key: 'importe', label: 'Importe' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

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

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_MESSAGES: Record<string, string> = {
  DEPOSIT_NOT_PAID: 'El depósito ya no está Pagado. Primero registra su pago.',
  DEPOSIT_REFUND_EXISTS: 'Este depósito ya tiene una devolución. Solo puede haber una.',
  DEPOSIT_REFUND_AMOUNT_EXCEEDED: 'El importe no puede ser mayor que el depósito recibido.',
};

function RefundForm({
  contract,
  deposit,
  today,
}: {
  contract: Contract;
  deposit: ContractDeposit;
  today: string;
}) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const create = useCreateDepositRefund();
  const [stage, setStage] = useState<Stage>('importe');
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<{ amount: string }>({
    // Empieza con el depósito completo.
    defaultValues: { amount: formatMoneyInput(deposit.amount) },
  });
  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;
  const place = shortPlaceName(contract.unit.name, contract.property);
  const detail = `/contratos/${contract.id}`;
  const inherited = deposit.origin_contract.id !== contract.id;
  const amount = toAmount(getValues('amount'));

  const toReview = handleSubmit(() => {
    setFailure(null);
    setStage('revisar');
  });

  const save = () => {
    setFailure(null);
    create.mutate(
      { deposit_payment_id: deposit.id, amount },
      {
        onSuccess: ({ data }) => {
          void navigate(detail, {
            replace: true,
            state: withResult({
              title: 'Registramos la devolución',
              body: `Salieron ${formatMoney(data.amount)} del depósito de ${name}. Aparece en Movimientos como gasto de ${place}.`,
            }),
          });
          void events.depositRefundChanged();
        },
        onError: error => {
          if (applyFieldErrors(error, setError, { amount: 'Revisa el importe a devolver.' })) {
            setStage('importe');
            return;
          }
          const result = setupFailure(error, 'No pudimos registrar la devolución.', false);
          if (result.tone === 'error' && isAppError(error) && CODE_MESSAGES[error.code]) {
            setFailure({ ...result, body: CODE_MESSAGES[error.code] });
            void events.depositRefundChanged();
          } else if (result.tone === 'uncertain')
            setFailure({
              ...result,
              title: 'No sabemos si se registró la devolución',
              body: 'Revisa el depósito antes de volver a intentarlo.',
            });
          else setFailure(result);
        },
      },
    );
  };

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    importe: { label: 'Cancelar', onClick: () => void navigate(detail) },
    revisar: { label: 'Importe', onClick: () => setStage('importe') },
  };

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ importe: stage === 'revisar' }}
      title="Devolver depósito"
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
        {stage === 'importe' ? (
          <>
            <Facts>
              <div>
                <dt>Depósito recibido</dt>
                <dd>{formatMoney(deposit.amount)}</dd>
              </div>
              {inherited ? (
                <div>
                  <dt>Contrato de origen</dt>
                  <dd>Contrato anterior</dd>
                </div>
              ) : null}
              <div>
                <dt>Contrato actual</dt>
                <dd>{contractKindLine(contract)}</dd>
              </div>
              <div>
                <dt>Unidad</dt>
                <dd>{place}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{formatDateWithYear(today)}</dd>
              </div>
            </Facts>
            <TextField
              label="Importe que se devolverá"
              format="money"
              prefix="$"
              autoComplete="off"
              help={`Empieza con el depósito completo. Puedes reducirlo; no puede ser mayor a ${formatMoney(deposit.amount)}.`}
              error={errors.amount?.message}
              {...register('amount', {
                validate: value => {
                  const next = toAmount(value);
                  if (next <= 0) return 'Escribe un importe mayor a cero.';
                  if (next > Number(deposit.amount))
                    return `No puede ser mayor que el depósito recibido: ${formatMoney(deposit.amount)}.`;
                  return true;
                },
              })}
            />
            <List as="p">
              Se registra como gasto de {place}. No termina el contrato y no descuenta los pagos
              atrasados de {name}.
            </List>
            <StickyStepFooter>
              <Button onClick={() => void toReview()}>Revisar devolución</Button>
            </StickyStepFooter>
          </>
        ) : (
          <>
            <StepIntro>
              <h2>Revisa la devolución</h2>
              <p>{place}</p>
            </StepIntro>
            <Facts>
              <div>
                <dt>Se devolverá a</dt>
                <dd>{name}</dd>
              </div>
              <div>
                <dt>Depósito recibido</dt>
                <dd>{formatMoney(deposit.amount)}</dd>
              </div>
              <div>
                <dt>Importe a devolver</dt>
                <dd>{formatMoney(amount)}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{formatDateWithYear(today)}</dd>
              </div>
              <div>
                <dt>Se registrará como</dt>
                <dd>Gasto · Devolución de depósito</dd>
              </div>
            </Facts>
            <List>
              <li>
                Saldrán {formatMoney(amount)} como gasto de {place} en Movimientos y en el resumen
                del mes.
              </li>
              {contract.is_current && contract.status !== 'terminated' ? (
                <li>El contrato no cambia y {place} sigue Ocupada.</li>
              ) : null}
              <li>Los pagos atrasados de {name} no cambian.</li>
            </List>
            <StickyStepFooter>
              {failure?.tone === 'uncertain' ? (
                <ButtonLink to={detail}>Ver depósito</ButtonLink>
              ) : (
                <Button onClick={save} loading={create.isPending} loadingLabel="Guardando…">
                  Registrar devolución de {formatMoney(amount)}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setStage('importe')}
                disabled={create.isPending}
              >
                Cambiar importe
              </Button>
            </StickyStepFooter>
          </>
        )}
      </StepPanel>
    </SetupLayout>
  );
}

/** Y-16: devolver el depósito Pagado de un contrato (también durante un contrato Activo). */
export function RefundDepositPage() {
  const { contractId } = useParams();
  const query = useContract(contractId);
  // La devolución usa la fecha de hoy del servidor; no se elige.
  const today = useAttentionPayments('all', '').meta?.as_of_date;

  if (query.isPending || !today) return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
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
  const deposit = contract.deposit;
  if (!deposit || deposit.status !== 'paid' || deposit.refund)
    return <Navigate to={`/contratos/${contract.id}`} replace />;
  return <RefundForm contract={contract} deposit={deposit} today={today} />;
}
