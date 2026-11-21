import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { isAppError } from '@api/errors';
import type {
  Expense,
  ExpenseChanges,
  ExpenseReviewState,
  ExpenseUpdatePreview,
  GeneralExpenseType,
} from '@api/expenses';
import {
  Button,
  ButtonLink,
  Notice,
  OptionGroup,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  TextField,
} from '@components';
import { toAmount } from '@features/contracts/form/ContractFields';
import { SetupLayout } from '@features/properties/setup/components/SetupLayout';
import { StepPanel, StickyStepFooter } from '@features/properties/setup/components/stepStyles';
import { setupFailure, type SetupFailure } from '@features/properties/setup/setupFailure';
import { useExpense, usePreviewExpenseUpdate, useUpdateExpense } from '@hooks/querys/expenses';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { expenseTypeLabel } from '@lib/labels';
import { formatMoneyInput } from '@lib/numericInput';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import {
  CATEGORIES,
  DESCRIPTION_MAX,
  destinationName,
  type ExpenseDestination,
} from '../create/destination';
import { DestinationPicker } from '../create/DestinationPicker';
import {
  Categories,
  Category,
  Facts,
  Field,
  FieldError,
  List,
  Picker,
} from '../create/expenseFormStyles';

type Values = {
  expense_type: GeneralExpenseType;
  amount: string;
  expense_date: string;
  description: string;
};

/** Destino actual del gasto (exactamente uno). */
const destinationOf = (expense: Expense): ExpenseDestination | null =>
  expense.unit?.property
    ? {
        kind: 'unit',
        unit: { id: expense.unit.id, name: expense.unit.name, property: expense.unit.property },
      }
    : expense.property
      ? { kind: 'property', property: expense.property }
      : null;

const sameDestination = (a: ExpenseDestination | null, b: ExpenseDestination | null) =>
  a?.kind === b?.kind &&
  (a?.kind === 'unit' && b?.kind === 'unit'
    ? a.unit.id === b.unit.id
    : a?.kind === 'property' && b?.kind === 'property'
      ? a.property.id === b.property.id
      : a === b);

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_MESSAGES: Record<string, string> = {
  EXPENSE_INACTIVE: 'Este gasto se eliminó mientras lo editabas. No guardamos nada.',
  INVALID_EXPENSE_TARGET:
    'El contrato relacionado no corresponde al nuevo destino. Quita la referencia al contrato o elige otro destino.',
  PROPERTY_NOT_FOUND: 'Ese destino ya no está disponible. Elige otro; lo demás se conserva.',
  UNIT_NOT_FOUND: 'Ese destino ya no está disponible. Elige otro; lo demás se conserva.',
  CONTRACT_NOT_FOUND: 'El contrato relacionado ya no existe. Quita la referencia al contrato.',
};

/** Dónde queda registrado un estado del gasto: "Torre Centro / Departamento 102" o la propiedad. */
const reviewPlace = (state: ExpenseReviewState) =>
  state.unit
    ? destinationName({ kind: 'unit', unit: state.unit })
    : state.property
      ? `${state.property.name} · toda la propiedad`
      : '';

/** E-04 "Revisa los cambios": antes → después del servidor, solo lo que cambió. */
function ReviewFacts({ preview }: { preview: ExpenseUpdatePreview }) {
  const { before, after } = preview;
  const placeChanged = reviewPlace(before) !== reviewPlace(after);
  return (
    <>
      <Facts aria-label="Revisa los cambios">
        {placeChanged ? (
          <div>
            <dt>Registrado en</dt>
            <dd>
              {reviewPlace(before)} → {reviewPlace(after)}
            </dd>
          </div>
        ) : null}
        {before.expense_type !== after.expense_type ? (
          <div>
            <dt>Categoría</dt>
            <dd>
              {expenseTypeLabel(before.expense_type)} → {expenseTypeLabel(after.expense_type)}
            </dd>
          </div>
        ) : null}
        {before.amount !== after.amount ? (
          <div>
            <dt>Importe</dt>
            <dd>
              −{formatMoney(before.amount)} → −{formatMoney(after.amount)}
            </dd>
          </div>
        ) : null}
        {before.expense_date !== after.expense_date ? (
          <div>
            <dt>Fecha</dt>
            <dd>
              {formatDateWithYear(before.expense_date)} → {formatDateWithYear(after.expense_date)}
            </dd>
          </div>
        ) : null}
        {before.description !== after.description ? (
          <div>
            <dt>Descripción</dt>
            <dd>{after.description ?? 'Sin descripción'}</dd>
          </div>
        ) : null}
        {before.related_contract_id !== after.related_contract_id ? (
          <div>
            <dt>Contrato relacionado</dt>
            <dd>{after.related_contract_id ? 'Cambia' : 'Se quita la referencia'}</dd>
          </div>
        ) : null}
      </Facts>
      <List>
        <li>Es el mismo gasto; no se crea otro.</li>
        {placeChanged ? (
          <li>
            Dejará de aparecer en los gastos de {reviewPlace(before)} y quedará en los de{' '}
            {reviewPlace(after)}.
          </li>
        ) : null}
      </List>
    </>
  );
}

function EditForm({ expense }: { expense: Expense }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const previewMutation = usePreviewExpenseUpdate();
  const update = useUpdateExpense();
  const original = destinationOf(expense);
  const [destination, setDestination] = useState<ExpenseDestination | null>(original);
  const [mode, setMode] = useState<ExpenseDestination['kind']>(original?.kind ?? 'unit');
  const [picking, setPicking] = useState(false);
  const [dropContract, setDropContract] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const [review, setReview] = useState<{
    key: string;
    preview: ExpenseUpdatePreview;
    changed: boolean;
  } | null>(null);
  const initial: Values = {
    expense_type: expense.expense_type === 'deposit_refund' ? 'other' : expense.expense_type,
    amount: formatMoneyInput(expense.amount),
    expense_date: expense.expense_date,
    description: expense.description ?? '',
  };
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<Values>({ defaultValues: initial });
  const values = useWatch({ control }) as Values;
  const detail = `/gastos/${expense.id}`;
  const title = expense.description || expenseTypeLabel(expense.expense_type);

  // Solo lo que cambió.
  const amount = toAmount(values.amount ?? '');
  const destinationChanged = Boolean(destination) && !sameDestination(original, destination);
  const changes: ExpenseChanges = {
    ...(destinationChanged && destination
      ? destination.kind === 'unit'
        ? { unit_id: destination.unit.id }
        : { property_id: destination.property.id }
      : {}),
    ...(dropContract && expense.related_contract_id ? { related_contract_id: null } : {}),
    ...(values.expense_type !== initial.expense_type ? { expense_type: values.expense_type } : {}),
    ...(amount > 0 && amount !== Number(expense.amount) ? { amount } : {}),
    ...(values.expense_date && values.expense_date !== expense.expense_date
      ? { expense_date: values.expense_date }
      : {}),
    ...(values.description !== initial.description
      ? { description: values.description.trim() ? values.description : null }
      : {}),
  };
  const changed = Object.keys(changes).length > 0;
  const changesKey = JSON.stringify(changes);
  // La revisión solo vale para los cambios que se revisaron.
  const current = review?.key === changesKey ? review : null;

  const onFailure = (error: unknown) => {
    if (
      applyFieldErrors(error, setError, {
        amount: 'Escribe un importe mayor a cero.',
        expense_date: 'Elige una fecha válida.',
        description: `Usa hasta ${DESCRIPTION_MAX} caracteres.`,
      })
    )
      return;
    const result = setupFailure(error, 'No pudimos guardar los cambios', false);
    if (result.tone === 'error' && isAppError(error) && CODE_MESSAGES[error.code]) {
      setFailure({ ...result, body: CODE_MESSAGES[error.code] });
      if (error.code === 'EXPENSE_INACTIVE') void events.expenseChanged();
    } else
      setFailure(
        result.tone === 'uncertain'
          ? {
              ...result,
              title: 'No sabemos si se guardaron los cambios',
              body: 'Revisa el gasto antes de volver a intentarlo.',
            }
          : result,
      );
  };

  // "Revisar cambios": el servidor arma el antes → después (FE-38).
  const requestReview = handleSubmit(() => {
    if (!destination) return;
    setFailure(null);
    previewMutation.mutate(
      { expenseId: expense.id, changes },
      {
        onSuccess: ({ data }) => setReview({ key: changesKey, preview: data, changed: false }),
        onError: onFailure,
      },
    );
  });

  const save = () => {
    if (!current) return;
    setFailure(null);
    update.mutate(
      { expenseId: expense.id, changes, previewToken: current.preview.preview_token },
      {
        onSuccess: ({ data }) => {
          void navigate(detail, {
            replace: true,
            state: withResult({
              title: 'Gasto actualizado',
              body: `${data.description || expenseTypeLabel(data.expense_type)} ahora es de −${formatMoney(data.amount)}${destinationChanged && destination ? ` y se registra en ${destinationName(destination)}` : ''}. Movimientos y el resumen de ${monthName(Number(data.expense_date.slice(0, 4)), Number(data.expense_date.slice(5, 7)))} ya lo reflejan.`,
            }),
          });
          void events.expenseChanged();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setReview({
              key: changesKey,
              preview: error.details.preview as ExpenseUpdatePreview,
              changed: true,
            });
            return;
          }
          onFailure(error);
        },
      },
    );
  };

  return (
    <SetupLayout
      step="datos"
      steps={[{ key: 'datos', label: 'Editar gasto' }] as const}
      done={{}}
      title="Editar gasto"
      subtitle={title}
      back={{ label: 'Cancelar', onClick: () => void navigate(detail) }}
      saving={update.isPending}
    >
      <StepPanel>
        {failure ? (
          <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
            {failure.body}
          </Notice>
        ) : null}
        <OptionGroup
          label="¿Dónde se registra?"
          value={mode}
          options={[
            { value: 'unit', label: 'Una unidad' },
            { value: 'property', label: 'Toda la propiedad' },
          ]}
          onChange={value => {
            setMode(value);
            setDestination(value === original?.kind ? original : null);
          }}
        />
        <Field>
          <span id="destination-label">{mode === 'unit' ? 'Unidad' : 'Propiedad'}</span>
          <Picker
            type="button"
            aria-labelledby="destination-label"
            $invalid={!destination}
            onClick={() => setPicking(true)}
          >
            {destination
              ? destinationName(destination)
              : mode === 'unit'
                ? 'Elige una unidad'
                : 'Elige una propiedad'}
            <span>{destination ? 'Cambiar' : 'Elegir'}</span>
          </Picker>
          {destination ? (
            <small>Busca por propiedad o unidad.</small>
          ) : (
            <FieldError role="alert">
              {mode === 'unit' ? 'Elige la unidad del gasto.' : 'Elige la propiedad del gasto.'}
            </FieldError>
          )}
        </Field>
        {expense.related_contract_id ? (
          <Notice tone="info" title="Contrato relacionado">
            <Link to={`/contratos/${expense.related_contract_id}`}>Ver contrato</Link>. Si cambias
            el destino, el contrato debe corresponder al nuevo; si no, quita la referencia.
            <label style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={dropContract}
                onChange={event => setDropContract(event.target.checked)}
              />
              Quitar la referencia al contrato
            </label>
          </Notice>
        ) : null}
        <Field role="radiogroup" aria-labelledby="category-label">
          <span id="category-label">Categoría</span>
          <Categories>
            {CATEGORIES.map(type => (
              <Category key={type} $selected={values.expense_type === type}>
                <input
                  type="radio"
                  className="visually-hidden"
                  value={type}
                  {...register('expense_type')}
                />
                {expenseTypeLabel(type)}
              </Category>
            ))}
          </Categories>
        </Field>
        <TextField
          label="Importe"
          format="money"
          prefix="$"
          autoComplete="off"
          help={`Antes: ${formatMoney(expense.amount)}`}
          error={errors.amount?.message}
          {...register('amount', {
            validate: value => toAmount(value) > 0 || 'Escribe un importe mayor a cero.',
          })}
        />
        <TextField
          label="Fecha"
          type="date"
          error={errors.expense_date?.message}
          {...register('expense_date', {
            validate: value => /^\d{4}-\d{2}-\d{2}$/.test(value) || 'Elige la fecha del gasto.',
          })}
        />
        <TextField
          label="Descripción (opcional)"
          autoComplete="off"
          error={errors.description?.message}
          {...register('description', {
            validate: value =>
              Array.from(value).length <= DESCRIPTION_MAX ||
              `Usa hasta ${DESCRIPTION_MAX} caracteres.`,
          })}
        />
        {current?.changed ? (
          <Notice tone="warning" title="El gasto cambió mientras lo editabas">
            {`Ahora es de −${formatMoney(current.preview.before.amount)}. Revisa tus cambios antes de guardar.`}
          </Notice>
        ) : null}
        {current ? <ReviewFacts preview={current.preview} /> : null}
        <StickyStepFooter>
          {failure?.tone === 'uncertain' ? (
            <ButtonLink to={detail}>Ver gasto</ButtonLink>
          ) : current ? (
            <Button onClick={save} loading={update.isPending} loadingLabel="Guardando…">
              Guardar cambios
            </Button>
          ) : (
            <Button
              onClick={() => void requestReview()}
              loading={previewMutation.isPending}
              loadingLabel="Revisando…"
              disabled={!changed || !destination}
            >
              Revisar cambios
            </Button>
          )}
        </StickyStepFooter>
      </StepPanel>
      <DestinationPicker
        open={picking}
        mode={mode}
        selected={destination}
        onClose={() => setPicking(false)}
        onSelect={next => {
          setDestination(next);
          setPicking(false);
        }}
      />
    </SetupLayout>
  );
}

/** E-04 Editar gasto general (no la devolución de depósito, que usa Y-17). */
export function EditExpensePage() {
  const { expenseId } = useParams();
  const query = useExpense(expenseId);

  if (query.isPending) return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
  if (query.isError)
    return (
      <>
        <ReturnLink to="/movimientos" label="Movimientos" />
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos este gasto" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </>
    );
  const expense = query.data.data;
  if (expense.expense_type === 'deposit_refund')
    return <Navigate to={`/gastos/${expense.id}`} replace />;
  return <EditForm expense={expense} />;
}
