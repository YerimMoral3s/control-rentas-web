import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import type { TenantInput } from '@api/tenants';
import { Button, Notice, TextField } from '@components';
import { normalizeMexicanPhone } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { tenantFailure, type SubmitFailure } from '../tenantFailure';
import { media } from '@styles/theme';

export type TenantFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  alias: string;
  secondary_phone: string;
};

/** Mensajes de F-03 / T-06: dicen cómo corregir, sin culpar. */
const REQUIRED = {
  first_name: 'Escribe el nombre.',
  last_name: 'Escribe los apellidos.',
  phone: 'Escribe el teléfono del inquilino.',
} as const;

const PHONE_FORMAT = 'Escribe un teléfono de 10 dígitos, por ejemplo 55 12 34 56 78.';

/** Errores del servidor por campo, con textos propios (nunca el mensaje del backend). */
const SERVER_FIELD_MESSAGES = {
  first_name: REQUIRED.first_name,
  last_name: REQUIRED.last_name,
  phone: PHONE_FORMAT,
  alias: 'Revisa cómo le dicen.',
  secondary_phone: {
    default: PHONE_FORMAT,
    IS_DIFFERENT_FROM: 'Debe ser distinto del teléfono principal.',
  },
};

const Card = styled.form`
  width: 100%;
  max-width: 560px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.panel};

  ${media.table} {
    padding: 24px;
  }
`;

const Names = styled.div`
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

const Footer = styled.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};

  ${media.table} {
    flex-direction: row-reverse;
    justify-content: flex-start;
    gap: 12px;
  }
`;

/** Lo capturado tal como se envía: teléfonos de México a 10 dígitos y opcionales vacíos como null. */
export const toTenantInput = (values: TenantFormValues): TenantInput => {
  const phone = (value: string) => normalizeMexicanPhone(value) ?? value.replace(/\s+/g, '');
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    phone: phone(values.phone),
    alias: values.alias.trim() || null,
    secondary_phone: values.secondary_phone.trim() ? phone(values.secondary_phone) : null,
  };
};

type TenantFormProps = {
  action: 'create' | 'update';
  defaultValues: TenantFormValues;
  submitLabel: string;
  saving: boolean;
  onCancel: () => void;
  /** Devuelve el error si no se guardó (undefined si salió bien); la captura nunca se borra. */
  onSubmit: (values: TenantFormValues) => Promise<unknown>;
};

/**
 * T-06 / T-08: Nombre(s), Apellidos y Teléfono obligatorios (diseño) más Alias y Otro teléfono
 * opcionales (FE-04). Si algo falla, lo escrito se conserva y no se reenvía solo.
 */
export function TenantForm({
  action,
  defaultValues,
  submitLabel,
  saving,
  onCancel,
  onSubmit,
}: TenantFormProps) {
  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TenantFormValues>({ defaultValues });

  const submit = handleSubmit(async values => {
    setFailure(null);
    const error = await onSubmit(values);
    if (!error) return;
    const marked = applyFieldErrors(error, setError, SERVER_FIELD_MESSAGES);
    setFailure(tenantFailure(error, action, marked));
  });

  const required = (field: keyof typeof REQUIRED) => ({
    validate: (value: string) => value.trim().length > 0 || REQUIRED[field],
  });

  /** FE-28: solo teléfonos de México; el otro teléfono es opcional y distinto del principal. */
  const phoneRules = {
    validate: (value: string) =>
      !value.trim() ? REQUIRED.phone : normalizeMexicanPhone(value) !== null || PHONE_FORMAT,
  };
  const secondaryRules = {
    validate: (value: string, values: TenantFormValues) => {
      if (!value.trim()) return true;
      const secondary = normalizeMexicanPhone(value);
      if (secondary === null) return PHONE_FORMAT;
      return (
        secondary !== normalizeMexicanPhone(values.phone) ||
        'Debe ser distinto del teléfono principal.'
      );
    },
  };

  return (
    <Card noValidate onSubmit={event => void submit(event)} aria-busy={saving || undefined}>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <Names>
        <TextField
          label="Nombre(s)"
          autoComplete="off"
          disabled={saving}
          error={errors.first_name?.message}
          {...register('first_name', required('first_name'))}
        />
        <TextField
          label="Apellidos"
          autoComplete="off"
          disabled={saving}
          error={errors.last_name?.message}
          {...register('last_name', required('last_name'))}
        />
      </Names>
      <TextField
        label="Teléfono"
        format="phone"
        autoComplete="off"
        placeholder="Ejemplo: 55 12 34 56 78"
        help="Sirve para escribirle por WhatsApp."
        disabled={saving}
        error={errors.phone?.message}
        {...register('phone', phoneRules)}
      />
      <Optional>Opcional</Optional>
      <TextField
        label="Cómo le dicen"
        autoComplete="off"
        help="Un apodo o nombre corto. También sirve para buscarlo."
        disabled={saving}
        error={errors.alias?.message}
        {...register('alias')}
      />
      <TextField
        label="Otro teléfono"
        format="phone"
        autoComplete="off"
        disabled={saving}
        error={errors.secondary_phone?.message}
        {...register('secondary_phone', secondaryRules)}
      />
      <Footer>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        <Button variant="neutral" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
      </Footer>
    </Card>
  );
}
