import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import type { Property } from '@api/properties';
import { Button, Notice, ReturnLink, SectionError, Skeleton, StateMessage } from '@components';
import { FormPage } from '@features/tenants/TenantCreatePage';
import { useProperty, useUpdateProperty } from '@hooks/querys/properties';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { applyFieldErrors } from '@lib/formErrors';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import {
  changedPropertyFields,
  PROPERTY_FIELD_MESSAGES,
  PropertyDataFields,
  propertyValuesOf,
  type PropertyValues,
} from '../components/PropertyDataFields';
import { propertyTypeLabel } from '../propertyText';
import { setupFailure, type SetupFailure } from '../setup/setupFailure';
import { EditCard, EditFooter, EditHead, Fixed } from './editStyles';

function PropertyEditForm({ property }: { property: Property }) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const update = useUpdateProperty();
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<PropertyValues>({ defaultValues: propertyValuesOf(property) });
  const detail = `/propiedades/${property.id}`;

  const submit = handleSubmit(async values => {
    setFailure(null);
    const changes = changedPropertyFields(values, dirtyFields);
    if (Object.keys(changes).length === 0) {
      void navigate(detail, { replace: true });
      return;
    }
    try {
      await update.mutateAsync({ propertyId: property.id, changes });
      void navigate(detail, { replace: true, state: withResult({ title: 'Cambios guardados.' }) });
      // El nombre se muestra en contratos, cobros e inquilinos.
      void events.placeRenamed();
    } catch (error) {
      const marked = applyFieldErrors(error, setError, PROPERTY_FIELD_MESSAGES);
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
      <PropertyDataFields
        register={register}
        errors={errors}
        saving={update.isPending}
        type={property.property_type}
      />
      <Fixed>
        Tipo
        <strong>{propertyTypeLabel(property.property_type)}</strong>
        {property.has_units
          ? 'El tipo no se puede cambiar porque ya tiene unidades.'
          : 'El tipo se cambia al continuar la configuración.'}
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

/** P-15 Editar propiedad: solo campos permitidos; el tipo no se edita aquí. */
export function PropertyEditPage() {
  const { propertyId } = useParams();
  const query = useProperty(propertyId);
  const back = <ReturnLink to={`/propiedades/${propertyId ?? ''}`} label="Volver" />;

  if (query.isPending)
    return (
      <FormPage aria-busy="true">
        {back}
        <Skeleton $height="320px" $radius={tokens.radius.panel} />
      </FormPage>
    );
  if (query.isError)
    return (
      <FormPage>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos esta propiedad" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </FormPage>
    );

  const property = query.data.data;
  return (
    <FormPage>
      {back}
      <EditHead>
        <h1>Editar propiedad</h1>
        <span>{property.name}</span>
      </EditHead>
      <PropertyEditForm property={property} />
    </FormPage>
  );
}
