import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import { isAppError } from '@api/errors';
import type { Unit } from '@api/units';
import {
  Button,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  TextField,
} from '@components';
import { FormPage } from '@features/tenants/TenantCreatePage';
import { useUnit, useUpdateUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { applyFieldErrors } from '@lib/formErrors';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import { isSingleUnit, unitTypeLabel } from '../propertyText';
import { setupFailure, type SetupFailure } from '../setup/setupFailure';
import { EditCard, EditFooter, EditHead, Fixed } from './editStyles';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function UnitEditForm({ unit }: { unit: Unit }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const update = useUpdateUnit();
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { name: unit.name } });
  const detail = `/unidades/${unit.id}`;

  const submit = handleSubmit(async ({ name }) => {
    setFailure(null);
    if (name.trim() === unit.name) {
      void navigate(detail, { replace: true });
      return;
    }
    try {
      await update.mutateAsync({ unitId: unit.id, changes: { name: name.trim() } });
      void navigate(detail, { replace: true, state: withResult({ title: 'Cambios guardados.' }) });
      void events.placeRenamed();
    } catch (error) {
      if (isAppError(error) && error.code === 'UNIT_NAME_ALREADY_EXISTS') {
        setError(
          'name',
          { message: `Ya existe ${name.trim()} en ${unit.property.name}. Usa otro nombre.` },
          { shouldFocus: true },
        );
        return;
      }
      const marked = applyFieldErrors(error, setError, { name: 'Escribe el nombre de la unidad.' });
      setFailure(setupFailure(error, 'No guardamos los cambios.', marked));
    }
  });

  return (
    <EditCard
      noValidate
      onSubmit={event => void submit(event)}
      aria-busy={update.isPending || undefined}
    >
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <TextField
        label="Nombre de la unidad"
        autoComplete="off"
        maxLength={120}
        disabled={update.isPending}
        error={errors.name?.message}
        {...register('name', {
          validate: value => value.trim().length > 0 || 'Escribe el nombre de la unidad.',
        })}
      />
      <Fixed>
        Tipo de unidad
        <strong>{capitalize(unitTypeLabel(unit.unit_type))}</strong>
      </Fixed>
      <Fixed>
        Estado
        <strong>
          {unit.status === 'maintenance'
            ? 'En mantenimiento'
            : unit.status === 'occupied'
              ? 'Ocupada'
              : 'Disponible'}
        </strong>
        El estado cambia con Enviar a mantenimiento o Marcar como disponible.
      </Fixed>
      <EditFooter>
        <Button type="submit" loading={update.isPending}>
          Guardar cambios
        </Button>
        <Button variant="neutral" disabled={update.isPending} onClick={() => void navigate(-1)}>
          Cancelar
        </Button>
      </EditFooter>
    </EditCard>
  );
}

/** P-15 Editar unidad: solo el nombre; el tipo y el estado no se editan aquí. */
export function UnitEditPage() {
  const { unitId } = useParams();
  const query = useUnit(unitId);
  const back = <ReturnLink to={`/unidades/${unitId ?? ''}`} label="Volver" />;

  if (query.isPending)
    return (
      <FormPage aria-busy="true">
        {back}
        <Skeleton $height="240px" $radius={tokens.radius.panel} />
      </FormPage>
    );
  if (query.isError)
    return (
      <FormPage>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos esta unidad" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </FormPage>
    );

  const unit = query.data.data;
  // Casa o bodega: se edita la propiedad.
  if (isSingleUnit(unit.property.property_type))
    return <Navigate to={`/propiedades/${unit.property.id}/editar`} replace />;
  return (
    <FormPage>
      {back}
      <EditHead>
        <h1>Editar unidad</h1>
        <span>
          {unit.name} · {unit.property.name}
        </span>
      </EditHead>
      <UnitEditForm unit={unit} />
    </FormPage>
  );
}
