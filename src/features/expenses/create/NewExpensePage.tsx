import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import type { Contract } from '@api/contracts';
import { isAppError } from '@api/errors';
import type { GeneralExpenseType } from '@api/expenses';
import {
  Button,
  ButtonLink,
  Notice,
  OptionGroup,
  ReturnLink,
  SectionError,
  Skeleton,
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
import { useCreateExpense } from '@hooks/querys/expenses';
import { useAttentionPayments } from '@hooks/querys/payments';
import { useProperty } from '@hooks/querys/properties';
import { useUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { expenseTypeLabel } from '@lib/labels';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import {
  CATEGORIES,
  DESCRIPTION_MAX,
  destinationBody,
  destinationKindLabel,
  destinationName,
  type ExpenseDestination,
} from './destination';
import { DestinationPicker } from './DestinationPicker';
import {
  Categories,
  Category,
  Facts,
  Field,
  FieldError,
  Fixed,
  List,
  Picker,
} from './expenseFormStyles';

type Stage = 'datos' | 'revisar';

const STAGES = [
  { key: 'datos', label: 'Datos del gasto' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

type Values = {
  expense_type: GeneralExpenseType | '';
  amount: string;
  expense_date: string;
  description: string;
};

/** Contexto de E-02: destino fijo o elegido, contrato de referencia y a dónde volver. */
type Context = {
  destination: ExpenseDestination | null;
  /** Desde un contrato el destino es su unidad y no se cambia. */
  locked: boolean;
  contract: Contract | null;
  back: { to: string; label: string };
};

/** Textos propios por código; nunca el mensaje del backend. */
const TARGET_CODES = ['INVALID_EXPENSE_TARGET', 'PROPERTY_NOT_FOUND', 'UNIT_NOT_FOUND'];

function ExpenseForm({ context, today }: { context: Context; today: string }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const create = useCreateExpense();
  const [stage, setStage] = useState<Stage>('datos');
  const [destination, setDestination] = useState<ExpenseDestination | null>(context.destination);
  const [mode, setMode] = useState<ExpenseDestination['kind']>(context.destination?.kind ?? 'unit');
  const [picking, setPicking] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    control,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: { expense_type: '', amount: '', expense_date: today, description: '' },
  });
  const category = useWatch({ control, name: 'expense_type' });
  const values = getValues();
  const amount = toAmount(values.amount);

  const toReview = handleSubmit(
    () => {
      if (!destination) {
        setDestinationError(
          mode === 'unit' ? 'Elige la unidad del gasto.' : 'Elige la propiedad del gasto.',
        );
        return;
      }
      setFailure(null);
      setStage('revisar');
    },
    () => {
      if (!destination)
        setDestinationError(
          mode === 'unit' ? 'Elige la unidad del gasto.' : 'Elige la propiedad del gasto.',
        );
    },
  );

  const save = () => {
    if (!destination || !values.expense_type) return;
    setFailure(null);
    create.mutate(
      {
        ...destinationBody(destination),
        ...(context.contract ? { related_contract_id: context.contract.id } : {}),
        expense_type: values.expense_type,
        amount,
        expense_date: values.expense_date,
        description: values.description.trim() ? values.description : null,
      },
      {
        onSuccess: ({ data }) => {
          void navigate(context.back.to, {
            replace: true,
            state: withResult({
              title: 'Registramos el gasto',
              body: `−${formatMoney(data.amount)} · ${expenseTypeLabel(data.expense_type)} · ${destinationName(destination)}`,
            }),
          });
          void events.expenseChanged();
        },
        onError: error => {
          if (
            applyFieldErrors(error, setError, {
              amount: 'Escribe un importe mayor a cero.',
              expense_date: 'Elige una fecha válida.',
              description: `Usa hasta ${DESCRIPTION_MAX} caracteres.`,
              expense_type: 'Elige una categoría.',
            })
          ) {
            setStage('datos');
            return;
          }
          if (isAppError(error) && TARGET_CODES.includes(error.code) && !context.locked) {
            // El destino dejó de existir: se elige otro; lo demás se conserva.
            setDestination(null);
            setDestinationError(
              `${destinationName(destination)} ya no está disponible. No registramos el gasto. Elige otro destino; lo demás se conserva.`,
            );
            setStage('datos');
            return;
          }
          const result = setupFailure(error, 'No pudimos registrar el gasto.', false);
          setFailure(
            result.tone === 'uncertain'
              ? {
                  ...result,
                  title: 'No sabemos si se registró el gasto',
                  body: 'Revisa Movimientos antes de volver a intentarlo.',
                }
              : result,
          );
        },
      },
    );
  };

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    datos: { label: 'Cancelar', onClick: () => void navigate(context.back.to) },
    revisar: { label: 'Datos del gasto', onClick: () => setStage('datos') },
  };

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ datos: stage === 'revisar' }}
      title={context.contract ? 'Registrar gasto relacionado' : 'Registrar gasto'}
      subtitle={destination ? destinationName(destination) : 'Gasto de una propiedad o unidad'}
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
            {context.locked || context.destination ? (
              <Fixed>
                <div>
                  <small>Se registrará en</small>
                  <strong>{destination ? destinationName(destination) : ''}</strong>
                  <small>{destination ? destinationKindLabel(destination) : ''}</small>
                </div>
                {context.locked ? null : (
                  <Button variant="tertiary" onClick={() => setPicking(true)}>
                    Cambiar
                  </Button>
                )}
              </Fixed>
            ) : (
              <>
                <OptionGroup
                  label="¿Dónde se registra?"
                  value={mode}
                  options={[
                    { value: 'unit', label: 'Una unidad' },
                    { value: 'property', label: 'Toda la propiedad' },
                  ]}
                  onChange={value => {
                    setMode(value);
                    setDestination(null);
                    setDestinationError(null);
                  }}
                />
                <Field>
                  <span id="destination-label">{mode === 'unit' ? 'Unidad' : 'Propiedad'}</span>
                  <Picker
                    type="button"
                    aria-labelledby="destination-label"
                    $invalid={Boolean(destinationError)}
                    onClick={() => setPicking(true)}
                  >
                    {destination
                      ? destinationName(destination)
                      : mode === 'unit'
                        ? 'Elige una unidad'
                        : 'Elige una propiedad'}
                    <span>{destination ? 'Cambiar' : 'Elegir'}</span>
                  </Picker>
                  {destinationError ? (
                    <FieldError role="alert">{destinationError}</FieldError>
                  ) : (
                    <small>Busca por propiedad o unidad.</small>
                  )}
                </Field>
              </>
            )}
            {context.locked && destinationError ? (
              <FieldError role="alert">{destinationError}</FieldError>
            ) : null}
            {context.contract ? (
              <Notice tone="info" title="Contrato relacionado">
                {context.contract.tenant.first_name} {context.contract.tenant.last_name} ·{' '}
                {contractKindLine(context.contract)}. El gasto pertenece a la unidad; el contrato
                queda solo como referencia.
              </Notice>
            ) : null}
            <Field role="radiogroup" aria-labelledby="category-label">
              <span id="category-label">Categoría</span>
              <Categories>
                {CATEGORIES.map(type => (
                  <Category key={type} $selected={category === type}>
                    <input
                      type="radio"
                      className="visually-hidden"
                      value={type}
                      {...register('expense_type', { required: 'Elige una categoría.' })}
                    />
                    {expenseTypeLabel(type)}
                  </Category>
                ))}
              </Categories>
              {errors.expense_type?.message ? (
                <FieldError role="alert">{errors.expense_type.message}</FieldError>
              ) : null}
            </Field>
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
              label="Fecha"
              type="date"
              help="Hoy. Puedes elegir otra fecha."
              error={errors.expense_date?.message}
              {...register('expense_date', {
                validate: value => /^\d{4}-\d{2}-\d{2}$/.test(value) || 'Elige la fecha del gasto.',
              })}
            />
            <TextField
              label="Descripción (opcional)"
              autoComplete="off"
              placeholder="Por ejemplo, Cambio de chapa"
              error={errors.description?.message}
              {...register('description', {
                validate: value =>
                  Array.from(value).length <= DESCRIPTION_MAX ||
                  `Usa hasta ${DESCRIPTION_MAX} caracteres.`,
              })}
            />
            <StickyStepFooter>
              <Button onClick={() => void toReview()}>Revisar gasto</Button>
            </StickyStepFooter>
          </>
        ) : destination && values.expense_type ? (
          <>
            <StepIntro>
              <h2>Revisa el gasto</h2>
            </StepIntro>
            <Facts>
              <div>
                <dt>Se registrará en</dt>
                <dd>{destinationName(destination)}</dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd>{destinationKindLabel(destination)}</dd>
              </div>
              {context.contract ? (
                <div>
                  <dt>Contrato relacionado</dt>
                  <dd>
                    {context.contract.tenant.first_name} {context.contract.tenant.last_name}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Categoría</dt>
                <dd>{expenseTypeLabel(values.expense_type)}</dd>
              </div>
              <div>
                <dt>Importe</dt>
                <dd>−{formatMoney(amount)}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{formatDateWithYear(values.expense_date)}</dd>
              </div>
              {values.description.trim() ? (
                <div>
                  <dt>Descripción</dt>
                  <dd>{values.description}</dd>
                </div>
              ) : null}
            </Facts>
            <List>
              <li>Aparecerá en Movimientos como gasto.</li>
              <li>
                Contará en los gastos de{' '}
                {monthName(
                  Number(values.expense_date.slice(0, 4)),
                  Number(values.expense_date.slice(5, 7)),
                )}{' '}
                del resumen del mes.
              </li>
            </List>
            <StickyStepFooter>
              {failure?.tone === 'uncertain' ? (
                <ButtonLink to="/movimientos">Ver Movimientos</ButtonLink>
              ) : (
                <Button onClick={save} loading={create.isPending} loadingLabel="Guardando…">
                  Registrar gasto de {formatMoney(amount)}
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
      <DestinationPicker
        open={picking}
        mode={context.destination ? context.destination.kind : mode}
        selected={destination}
        onClose={() => setPicking(false)}
        onSelect={next => {
          setDestination(next);
          setDestinationError(null);
          setPicking(false);
        }}
      />
    </SetupLayout>
  );
}

/**
 * E-01 / E-02 Registrar gasto: desde Movimientos (`/gastos/nuevo`), una propiedad (`?propiedad=`),
 * una unidad (`?unidad=`) o un contrato (`?contrato=`, destino fijo en su unidad y contrato como
 * referencia). Al terminar vuelve al contexto de origen con el resultado.
 */
export function NewExpensePage() {
  const [params] = useSearchParams();
  const contractId = params.get('contrato') ?? undefined;
  const unitId = contractId ? undefined : (params.get('unidad') ?? undefined);
  const propertyId = contractId || unitId ? undefined : (params.get('propiedad') ?? undefined);
  const contract = useContract(contractId);
  const unit = useUnit(unitId);
  const property = useProperty(propertyId);
  // La fecha propone el día de hoy del servidor.
  const today = useAttentionPayments('all', '').meta?.as_of_date;

  const loading =
    !today ||
    (contractId && contract.isPending) ||
    (unitId && unit.isPending) ||
    (propertyId && property.isPending);
  const failed =
    (contractId && contract.isError) ||
    (unitId && unit.isError) ||
    (propertyId && property.isError);

  if (failed)
    return (
      <>
        <ReturnLink to="/movimientos" label="Movimientos" />
        <SectionError
          onRetry={() => {
            void contract.refetch();
            void unit.refetch();
            void property.refetch();
          }}
          retrying={contract.isFetching || unit.isFetching || property.isFetching}
        />
      </>
    );
  if (loading || !today) return <Skeleton $height="320px" $radius={tokens.radius.panel} />;

  let context: Context = {
    destination: null,
    locked: false,
    contract: null,
    back: { to: '/movimientos', label: 'Movimientos' },
  };
  const contractData = contract.data?.data;
  const unitData = unit.data?.data;
  const propertyData = property.data?.data;
  if (contractId && contractData)
    context = {
      destination: {
        kind: 'unit',
        unit: {
          id: contractData.unit.id,
          name: contractData.unit.name,
          property: contractData.property,
        },
      },
      locked: true,
      contract: contractData,
      back: { to: `/contratos/${contractData.id}`, label: 'Contrato' },
    };
  else if (unitId && unitData)
    context = {
      destination: { kind: 'unit', unit: unitData },
      locked: false,
      contract: null,
      // Casa o bodega no tienen detalle de unidad propio: se vuelve a la propiedad.
      back:
        unitData.property.property_type === 'house' ||
        unitData.property.property_type === 'warehouse'
          ? { to: `/propiedades/${unitData.property.id}`, label: unitData.property.name }
          : { to: `/unidades/${unitData.id}`, label: unitData.name },
    };
  else if (propertyId && propertyData)
    context = {
      destination: { kind: 'property', property: propertyData },
      locked: false,
      contract: null,
      back: { to: `/propiedades/${propertyData.id}`, label: propertyData.name },
    };

  return <ExpenseForm context={context} today={today} />;
}
