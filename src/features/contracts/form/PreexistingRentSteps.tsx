import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { CreationPreview, PreexistingContractInput } from '@api/contracts';
import type { Tenant } from '@api/tenants';
import { setupFailure, type SetupFailure } from '@features/properties/setup/setupFailure';
import {
  useCreatePreexistingContract,
  usePreviewPreexistingContract,
} from '@hooks/querys/contracts';
import { contractEndDate } from '@lib/dates';
import { applyFieldErrors } from '@lib/formErrors';
import {
  ContractFields,
  depositRequired,
  durationOf,
  EMPTY_CONTRACT,
  toAmount,
  type ContractValues,
} from './ContractFields';
import { RentReview } from './RentReview';
import { TenantPicker } from './TenantPicker';

export type PreexistingStage = 'tenant' | 'contract' | 'review';

const STAGES: ReadonlyArray<{ key: PreexistingStage; label: string }> = [
  { key: 'tenant', label: 'Inquilino' },
  { key: 'contract', label: 'Contrato' },
  { key: 'review', label: 'Revisar' },
];

/** Bloque azul de P-10: fija la unidad y marca Inquilino, Contrato y Revisar. */
const Stages = styled.ol`
  margin: 0;
  padding: 10px 12px;
  list-style: none;
  display: flex;
  gap: 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.primary50};
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};

  li[aria-current='step'] {
    font-weight: 700;
    color: ${({ theme }) => theme.color.primary700};
  }
`;

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_MESSAGES: Record<string, string> = {
  UNIT_HAS_CURRENT_OCCUPANCY: 'Esta unidad ya tiene su contrato actual.',
  UNIT_IN_MAINTENANCE: 'La unidad está En mantenimiento: márcala como disponible primero.',
  INVALID_CONTRACT_DURATION: 'Revisa la duración del contrato.',
  INVALID_FIXED_DUE_DAY: 'Escribe un día de pago del 1 al 31.',
  TENANT_NOT_FOUND: 'Ese inquilino ya no está disponible. Elige otro.',
};

const FIELD_MESSAGES = {
  start_date: 'Revisa la fecha de inicio: no puede ser posterior a hoy.',
  rent_amount: 'Revisa la renta mensual.',
  fixed_due_day: 'Escribe un día del 1 al 31.',
  deposit_amount: 'Revisa el importe del depósito.',
};

const failureOf = (error: unknown, notSaved: string, marked: boolean): SetupFailure => {
  const result = setupFailure(error, notSaved, marked);
  if (result.tone === 'error' && !marked && isAppError(error) && CODE_MESSAGES[error.code])
    return { ...result, body: `${CODE_MESSAGES[error.code]} Lo que escribiste sigue aquí.` };
  return result;
};

type PreexistingRentStepsProps = {
  unitId: string;
  /** Como se muestra la unidad (casa o bodega: el nombre de la propiedad). */
  place: string;
  stage: PreexistingStage;
  onStageChange: (stage: PreexistingStage) => void;
  /** Después de guardar (la pantalla decide a dónde volver y qué refrescar). */
  onSaved: (tenantId: string) => Promise<void> | void;
  /** C-18: textos de contrato existente (desde la unidad). */
  existing?: boolean;
};

/**
 * P-10 y C-18: renta que ya existía (contrato preexistente). Inquilino (catálogo + Crear
 * inquilino), contrato con fechas reales y revisión del servidor; guarda con su `preview_token`.
 */
export function PreexistingRentSteps({
  unitId,
  place,
  stage,
  onStageChange,
  onSaved,
  existing = false,
}: PreexistingRentStepsProps) {
  const previewMutation = usePreviewPreexistingContract();
  const create = useCreatePreexistingContract();
  const [tenant, setTenant] = useState<Pick<Tenant, 'id' | 'phone'> | null>(null);
  const [preview, setPreview] = useState<CreationPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const [finishing, setFinishing] = useState(false);
  const form = useForm<ContractValues>({ defaultValues: EMPTY_CONTRACT });

  const toInput = (values: ContractValues): PreexistingContractInput => {
    const deposit = depositRequired(values);
    return {
      unit_id: unitId,
      tenant_id: tenant?.id ?? '',
      contract_type: values.contract_type,
      duration_months: durationOf(values),
      rent_amount: toAmount(values.rent_amount),
      deposit_required: deposit,
      deposit_amount: deposit ? toAmount(values.deposit_amount) : null,
      start_date: values.start_date,
      end_date: contractEndDate(values.start_date, durationOf(values)),
      fixed_due_day: Number(values.fixed_due_day),
    };
  };

  const requestReview = form.handleSubmit(async values => {
    setFailure(null);
    setChanged(false);
    try {
      const { data } = await previewMutation.mutateAsync(toInput(values));
      setPreview(data);
      onStageChange('review');
    } catch (error) {
      const marked = applyFieldErrors(error, form.setError, FIELD_MESSAGES);
      setFailure(failureOf(error, 'No pudimos revisar la renta actual.', marked));
    }
  });

  const save = async () => {
    if (!preview || !tenant) return;
    setFailure(null);
    try {
      await create.mutateAsync({
        ...toInput(form.getValues()),
        preview_token: preview.preview_token,
      });
    } catch (error) {
      if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
        // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
        setPreview(error.details.preview as CreationPreview);
        setChanged(true);
        return;
      }
      setFailure(failureOf(error, 'No guardamos la renta actual.', false));
      return;
    }
    setFinishing(true);
    await onSaved(tenant.id);
  };

  return (
    <>
      <Stages aria-label={existing ? 'Contrato existente' : 'Renta actual'}>
        {STAGES.map((item, index) => (
          <li key={item.key} aria-current={item.key === stage ? 'step' : undefined}>
            {index + 1}. {item.label}
          </li>
        ))}
      </Stages>
      {stage === 'tenant' ? (
        <TenantPicker
          unitName={place}
          selectedId={tenant?.id ?? null}
          onSelect={selected => {
            setTenant(selected);
            setPreview(null);
          }}
          onContinue={() => onStageChange('contract')}
        />
      ) : stage === 'contract' ? (
        <ContractFields
          form={form}
          failure={failure}
          reviewing={previewMutation.isPending}
          onReview={() => void requestReview()}
        />
      ) : preview ? (
        <RentReview
          preview={preview}
          existing={existing}
          tenantPhone={tenant?.phone ?? null}
          changed={changed}
          failure={failure}
          saving={create.isPending || finishing}
          onSave={() => void save()}
          onChangeTenant={() => onStageChange('tenant')}
          onChangeData={() => {
            setFailure(null);
            onStageChange('contract');
          }}
        />
      ) : null}
    </>
  );
}
