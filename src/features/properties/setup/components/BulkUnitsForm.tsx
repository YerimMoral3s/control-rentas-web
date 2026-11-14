import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import styled from 'styled-components';
import type { Property } from '@api/properties';
import type { Unit, UnitType } from '@api/units';
import { Button, Notice, OptionGroup, TextField } from '@components';
import { useCreateUnitsBulk } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { applyFieldErrors } from '@lib/formErrors';
import { media } from '@styles/theme';
import { setupFailure, type SetupFailure } from '../setupFailure';
import {
  existingNames,
  groupCount,
  groupTypesFor,
  groupWords,
  joinNames,
  previewNames,
} from '../setupText';
import { StepFooter, StepIntro } from './stepStyles';

/** Tope de la vista previa: la API no declara máximo (FE-29). */
const MAX_QUANTITY = 100;

type Values = { quantity: string; name: string; start_at: string };

const Pair = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Preview = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  h3 {
    margin: 0;
    font-size: 15px;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px 16px;
    max-height: 280px;
    overflow-y: auto;

    ${media.desktop} {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 15px;
    line-height: 22px;
  }

  em {
    font-style: normal;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.danger};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const toInt = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN);

type BulkUnitsFormProps = {
  property: Property;
  units: Unit[];
  unitType: UnitType;
  onUnitTypeChange: (type: UnitType) => void;
  /** Volver a unidades conserva lo escrito (el formulario sigue montado arriba). */
  onClose: () => void;
  /** Texto de la salida; por defecto "Volver a unidades" (en P-14, "Volver a <propiedad>"). */
  closeLabel?: string;
  /** Cuántas creó el servidor y de qué tipo. */
  onCreated: (created: { count: number; unitType: UnitType }) => void;
};

/**
 * P-08: tipo, cantidad, nombre y número inicial. La lista se actualiza al escribir y es la
 * revisión: no hay otro diálogo. Nombres repetidos marcan Número inicial y solo bloquean Crear.
 */
export function BulkUnitsForm({
  property,
  units,
  unitType,
  onUnitTypeChange,
  onClose,
  closeLabel = 'Volver a unidades',
  onCreated,
}: BulkUnitsFormProps) {
  const events = useInvalidateEvents();
  const bulk = useCreateUnitsBulk();
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const words = groupWords(unitType);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { quantity: '', name: words.name, start_at: '1' } });
  const [quantityText, name, startText] = useWatch({
    control,
    name: ['quantity', 'name', 'start_at'],
  });
  const quantity = toInt(quantityText);
  const start = toInt(startText);
  const validPreview =
    quantity >= 1 && quantity <= MAX_QUANTITY && start >= 0 && name.trim().length > 0;
  const names = validPreview ? previewNames(name, start, quantity) : [];
  const repeated = existingNames(names, units);
  const allowed = groupTypesFor(property.property_type);

  const changeType = (type: UnitType) => {
    // El nombre sugerido sigue al tipo si no se había cambiado.
    if (name.trim() === words.name) setValue('name', groupWords(type).name);
    onUnitTypeChange(type);
  };

  const submit = handleSubmit(async values => {
    setFailure(null);
    if (repeated.length > 0) return;
    try {
      const { data } = await bulk.mutateAsync({
        property_id: property.id,
        blocks: [
          {
            unit_type: unitType,
            quantity: toInt(values.quantity),
            naming_pattern: `${values.name.trim()} {n}`,
            start_at: toInt(values.start_at),
          },
        ],
      });
      await events.unitsChanged(property.id);
      onCreated({ count: data.created_count, unitType });
    } catch (error) {
      const marked = applyFieldErrors(error, setError, {
        'blocks.0.quantity': 'Escribe cuántas quieres crear.',
        'blocks.0.naming_pattern': 'Escribe el nombre.',
        'blocks.0.start_at': 'Escribe el número inicial.',
      } as never);
      const result = setupFailure(
        error,
        `No pudimos crear los ${groupCount(unitType, toInt(values.quantity))}`,
        marked,
      );
      setFailure(
        result.tone === 'error'
          ? { ...result, body: 'No se creó ninguna y tus datos siguen aquí.' }
          : result,
      );
    }
  });

  const startError =
    errors.start_at?.message ??
    (repeated.length > 0
      ? `${joinNames(repeated)} ${repeated.length === 1 ? 'ya existe' : 'ya existen'} en ${property.name}. Empieza en otro número.`
      : undefined);

  return (
    <Form noValidate onSubmit={event => void submit(event)} aria-busy={bulk.isPending || undefined}>
      <StepIntro>
        <h2>Agregar {words.many}</h2>
      </StepIntro>
      {failure ? (
        <Notice
          tone={failure.tone}
          title={failure.title}
          requestId={failure.requestId}
          action={
            failure.tone === 'error' ? (
              <Button variant="secondary" type="submit" loading={bulk.isPending}>
                Intentar de nuevo
              </Button>
            ) : undefined
          }
        >
          {failure.body}
        </Notice>
      ) : null}
      {allowed.length > 1 ? (
        <OptionGroup
          label="Tipo de unidad"
          value={unitType}
          options={allowed.map(type => ({
            value: type,
            label: type === 'apartment' ? 'Departamento' : 'Local',
          }))}
          onChange={changeType}
        />
      ) : null}
      <TextField
        label="Cantidad"
        format="digits"
        maxLength={3}
        autoComplete="off"
        placeholder="Ejemplo: 8"
        disabled={bulk.isPending}
        error={errors.quantity?.message}
        {...register('quantity', {
          validate: value => {
            const number = toInt(value);
            if (!(number >= 1)) return `Escribe cuántos ${words.many} quieres crear.`;
            return number <= MAX_QUANTITY || `Puedes crear hasta ${MAX_QUANTITY} a la vez.`;
          },
        })}
      />
      <Pair>
        <TextField
          label="Nombre"
          help="Se repite en cada unidad, seguido del número"
          autoComplete="off"
          maxLength={140}
          disabled={bulk.isPending}
          error={errors.name?.message}
          {...register('name', {
            validate: value => value.trim().length > 0 || 'Escribe el nombre.',
          })}
        />
        <TextField
          label="Número inicial"
          help="Ejemplo: 101, o 1 para empezar en Local 1"
          format="digits"
          maxLength={6}
          autoComplete="off"
          disabled={bulk.isPending}
          error={startError}
          {...register('start_at', {
            validate: value => toInt(value) >= 0 || 'Escribe el número inicial.',
          })}
        />
      </Pair>
      {names.length > 0 ? (
        <Preview aria-live="polite">
          <h3>Se crearán {groupCount(unitType, names.length)}</h3>
          <ol>
            {names.map(item => (
              <li key={item}>
                {item}
                {repeated.includes(item) ? <em>Ya existe</em> : null}
              </li>
            ))}
          </ol>
        </Preview>
      ) : null}
      <StepFooter>
        <Button
          type="submit"
          loading={bulk.isPending}
          loadingLabel="Creando…"
          disabled={repeated.length > 0}
        >
          {names.length > 0 ? `Crear ${groupCount(unitType, names.length)}` : `Crear ${words.many}`}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={bulk.isPending}>
          {closeLabel}
        </Button>
      </StepFooter>
    </Form>
  );
}
