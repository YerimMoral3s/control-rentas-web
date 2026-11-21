import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import styled from 'styled-components';
import type { Property, PropertyInput, PropertyType } from '@api/properties';
import { TextField } from '@components';
import { media } from '@styles/theme';

/** Datos de la propiedad de P-06 y P-15 (FE-03): nombre y código postal obligatorios. */
export type PropertyValues = {
  [K in keyof Omit<PropertyInput, 'property_type'>]: string;
};

const TEXT_FIELDS = [
  'name',
  'postal_code',
  'neighborhood',
  'street',
  'external_number',
  'internal_number',
  'city',
  'state',
  'reference_notes',
] as const;

const REQUIRED = {
  name: 'Escribe el nombre de la propiedad.',
  postal_code: 'Escribe el código postal.',
};

/** FE-05: largo de cada columna; así un texto largo no termina en error del servidor. */
const MAX_LENGTH: Partial<Record<keyof PropertyValues, number>> = {
  name: 150,
  // Código postal de México: 5 dígitos (pedido del usuario, 13 nov.).
  postal_code: 5,
  street: 150,
  external_number: 30,
  internal_number: 30,
  neighborhood: 120,
  city: 120,
  state: 120,
};

const POSTAL_CODE_FORMAT = 'Escribe los 5 dígitos del código postal, por ejemplo 03100.';

/** Errores del servidor por campo, con textos propios. */
export const PROPERTY_FIELD_MESSAGES = {
  ...REQUIRED,
  postal_code: POSTAL_CODE_FORMAT,
  property_type: 'Elige el tipo de propiedad.',
  street: 'Revisa la calle.',
  external_number: 'Revisa el número exterior.',
  internal_number: 'Revisa el número interior.',
  neighborhood: 'Revisa la colonia.',
  city: 'Revisa la ciudad.',
  state: 'Revisa el estado.',
  reference_notes: 'Revisa las referencias.',
};

export const propertyValuesOf = (property: Property | undefined): PropertyValues => {
  const values = {} as PropertyValues;
  for (const field of TEXT_FIELDS) values[field] = property?.[field] ?? '';
  return values;
};

/** Lo capturado como se envía: obligatorios recortados, opcionales vacíos como null. */
export const toPropertyFields = (values: PropertyValues) => {
  const input = {} as Omit<PropertyInput, 'property_type'>;
  for (const field of TEXT_FIELDS) {
    const value = values[field].trim();
    (input as Record<string, string | null>)[field] =
      field === 'name' || field === 'postal_code' ? value : value || null;
  }
  return input;
};

/** Solo lo que cambió (PATCH). */
export const changedPropertyFields = (
  values: PropertyValues,
  dirty: Partial<Record<keyof PropertyValues, boolean | undefined>>,
) => {
  const input = toPropertyFields(values);
  const changes: Partial<PropertyInput> = {};
  for (const field of TEXT_FIELDS)
    if (dirty[field]) (changes as Record<string, unknown>)[field] = input[field];
  return changes;
};

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Pair = styled.div`
  display: grid;
  gap: 20px;

  ${media.table} {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
`;

const Optional = styled.p`
  margin: 4px 0 -8px;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral600};
`;

type PropertyDataFieldsProps = {
  register: UseFormRegister<PropertyValues>;
  errors: FieldErrors<PropertyValues>;
  saving: boolean;
  type: PropertyType | undefined;
};

/** Campos de la propiedad con los patrones de F-03 (P-06 y Editar propiedad). */
export function PropertyDataFields({ register, errors, saving, type }: PropertyDataFieldsProps) {
  const field = (
    name: keyof PropertyValues,
    label: string,
    extra?: { help?: string; placeholder?: string; format?: 'digits' },
  ) => (
    <TextField
      label={label}
      autoComplete="off"
      maxLength={MAX_LENGTH[name]}
      disabled={saving}
      error={errors[name]?.message}
      {...extra}
      {...register(
        name,
        name in REQUIRED
          ? {
              validate: (value: string) => {
                if (!value.trim()) return REQUIRED[name as keyof typeof REQUIRED];
                return name !== 'postal_code' || /^\d{5}$/.test(value.trim()) || POSTAL_CODE_FORMAT;
              },
            }
          : undefined,
      )}
    />
  );

  return (
    <Fields>
      {field('name', 'Nombre de la propiedad', {
        placeholder: type === 'house' ? 'Ejemplo: Casa 3' : 'Ejemplo: Torre Centro o Casa 3',
      })}
      {field('postal_code', 'Código postal', {
        placeholder: 'Ejemplo: 03100',
        format: 'digits',
      })}
      <Optional>Opcional</Optional>
      {field('neighborhood', 'Ubicación', { help: 'Colonia, fraccionamiento o conjunto' })}
      {field('street', 'Calle')}
      <Pair>
        {field('external_number', 'Número exterior')}
        {field('internal_number', 'Número interior')}
      </Pair>
      <Pair>
        {field('city', 'Ciudad')}
        {field('state', 'Estado')}
      </Pair>
      {field('reference_notes', 'Referencias', {
        help: 'Algo que ayude a ubicarla, por ejemplo "frente al parque".',
      })}
    </Fields>
  );
}
