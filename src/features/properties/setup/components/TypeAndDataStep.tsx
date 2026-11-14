import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import type { Property, PropertyInput, PropertyType } from '@api/properties';
import type { Unit } from '@api/units';
import { Button, Notice } from '@components';
import {
  changedPropertyFields,
  PROPERTY_FIELD_MESSAGES,
  PropertyDataFields,
  propertyValuesOf,
  toPropertyFields,
  type PropertyValues,
} from '@features/properties/components/PropertyDataFields';
import { useCreateProperty, useUpdateProperty } from '@hooks/querys/properties';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { applyFieldErrors } from '@lib/formErrors';
import { useMediaQuery } from '@lib/useMediaQuery';
import { theme as tokens } from '@styles/theme';
import { setupFailure, type SetupFailure } from '../setupFailure';
import { useSetupNavigation } from '../setupNavigation';
import { groupTypesFor, propertyTypeOption, SINGLE_UNIT, setupSubtitle } from '../setupText';
import { SetupLayout } from './SetupLayout';
import { StepFooter, StepIntro, StepPanel } from './stepStyles';
import { TypeCards } from './TypeCards';

const Chosen = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  span {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  strong {
    font-size: 16px;
    color: ${({ theme }) => theme.color.neutral950};
  }
`;

type TypeAndDataStepProps = {
  /** Sin propiedad: alta nueva (P-05 → P-06). */
  property?: Property;
  units?: Unit[];
};

/** Paso 1 (P-05 + P-06): tipo y datos. En celular son dos vistas; en computadora, una. */
export function TypeAndDataStep({ property, units = [] }: TypeAndDataStepProps) {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  const nav = useSetupNavigation();
  const events = useInvalidateEvents();
  const create = useCreateProperty();
  const update = useUpdateProperty();
  const [type, setType] = useState<PropertyType | undefined>(property?.property_type);
  const [typeError, setTypeError] = useState<string | null>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  /** Sin tipo: el aviso queda junto a las tarjetas y se lleva la vista ahí. */
  const missingType = () => {
    setTypeError('Elige el tipo de propiedad.');
    requestAnimationFrame(() => typeRef.current?.scrollIntoView({ block: 'center' }));
  };
  const [phase, setPhase] = useState<'type' | 'data'>(property ? 'data' : 'type');
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<PropertyValues>({ defaultValues: propertyValuesOf(property) });
  const saving = create.isPending || update.isPending;

  /** Con unidades capturadas solo se ofrecen tipos que las admiten (quitar unidades: fase 4D). */
  const unitTypes = new Set(units.map(unit => unit.unit_type));
  const isIncompatible = (candidate: PropertyType) => {
    if (units.length === 0) return false;
    const single = SINGLE_UNIT[candidate];
    if (single) return units.length > 1 || !unitTypes.has(single.unit_type);
    const allowed = groupTypesFor(candidate);
    return [...unitTypes].some(unitType => !allowed.includes(unitType));
  };

  const showType = isDesktop || phase === 'type';
  const showData = isDesktop || phase === 'data';

  const save = (exit: boolean) =>
    handleSubmit(async values => {
      setFailure(null);
      if (!type) {
        missingType();
        return;
      }
      const input: PropertyInput = { ...toPropertyFields(values), property_type: type };
      try {
        if (!property) {
          const { data } = await create.mutateAsync(input);
          await events.propertyCreated();
          if (exit) nav.exit();
          else nav.goToStep(data.id, 'unidades', true);
          return;
        }
        // Solo lo que cambió (PATCH); si nada cambió, no se guarda nada.
        const changes = changedPropertyFields(values, dirtyFields);
        if (type !== property.property_type) changes.property_type = type;
        if (Object.keys(changes).length > 0) {
          await update.mutateAsync({ propertyId: property.id, changes });
          await events.propertyUpdated(property.id);
        }
        if (exit) nav.exit();
        else nav.goToStep(property.id, 'unidades');
      } catch (error) {
        const marked = applyFieldErrors(error, setError, PROPERTY_FIELD_MESSAGES);
        setFailure(
          setupFailure(
            error,
            property ? 'No guardamos los cambios.' : 'No creamos la propiedad.',
            marked,
          ),
        );
        if (!isDesktop && marked) setPhase('data');
      }
    })();

  const chooseType = (next: PropertyType) => {
    setType(next);
    setTypeError(null);
  };

  const option = type ? propertyTypeOption(type) : undefined;

  return (
    <SetupLayout
      property={property}
      step="tipo"
      done={{ tipo: Boolean(property), unidades: property?.has_units }}
      stepTo={property ? step => nav.stepPath(property.id, step) : undefined}
      title={property?.name ?? 'Agregar propiedad'}
      subtitle={
        property
          ? setupSubtitle(property, propertyTypeOption(property.property_type).title)
          : undefined
      }
      back={
        !isDesktop && phase === 'data' && !property
          ? { label: 'Atrás', onClick: () => setPhase('type') }
          : {
              label: property ? 'Propiedades' : 'Cancelar',
              onClick: property ? nav.exit : nav.cancel,
            }
      }
      onSaveExit={property || (!isDesktop && phase === 'data') ? () => void save(true) : undefined}
      saving={saving}
    >
      <StepPanel
        as="form"
        noValidate
        onSubmit={event => {
          event.preventDefault();
          if (!isDesktop && phase === 'type') {
            if (type) setPhase('data');
            else missingType();
            return;
          }
          void save(false);
        }}
      >
        {failure ? (
          <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
            {failure.body}
          </Notice>
        ) : null}
        {showType ? (
          <>
            <StepIntro ref={typeRef}>
              <h2>¿Qué tipo de propiedad quieres agregar?</h2>
              <p>Así sabremos qué unidades puede tener.</p>
            </StepIntro>
            {typeError ? <Notice tone="error" title={typeError} /> : null}
            <TypeCards
              value={type}
              onChange={chooseType}
              isDisabled={isIncompatible}
              disabledNote="No admite las unidades que ya agregaste."
            />
          </>
        ) : null}
        {showData ? (
          <>
            <StepIntro>
              <h2>Datos de la propiedad</h2>
            </StepIntro>
            {!isDesktop && option ? (
              <Chosen>
                <span>
                  Tipo elegido
                  <strong>{option.title}</strong>
                  {option.units}
                </span>
                <Button variant="tertiary" onClick={() => setPhase('type')} disabled={saving}>
                  Cambiar tipo
                </Button>
              </Chosen>
            ) : null}
            <PropertyDataFields register={register} errors={errors} saving={saving} type={type} />
          </>
        ) : null}
        <StepFooter>
          <Button type="submit" loading={saving}>
            {!isDesktop && phase === 'type'
              ? 'Continuar con la propiedad'
              : 'Continuar con las unidades'}
          </Button>
        </StepFooter>
      </StepPanel>
    </SetupLayout>
  );
}
