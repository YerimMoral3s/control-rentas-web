import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { CreatedContract, CreationPreview, NewContractInput } from '@api/contracts';
import type { Tenant } from '@api/tenants';
import type { UnitSummary } from '@api/units';
import { ReturnLink, SectionError, Skeleton, StateMessage } from '@components';
import { SetupLayout } from '@features/properties/setup/components/SetupLayout';
import { StepPanel } from '@features/properties/setup/components/stepStyles';
import { setupFailure, type SetupFailure } from '@features/properties/setup/setupFailure';
import { useCreateContract, usePreviewContract } from '@hooks/querys/contracts';
import { useTenant } from '@hooks/querys/tenants';
import { useUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { applyFieldErrors } from '@lib/formErrors';
import { formatPhone } from '@lib/format';
import { placeName } from '@lib/place';
import { joinNames } from '@features/properties/setup/setupText';
import { theme as tokens } from '@styles/theme';
import {
  ContractFields,
  durationOf,
  EMPTY_CONTRACT,
  toAmount,
  type ContractValues,
} from '../form/ContractFields';
import { RentReview } from '../form/RentReview';
import { TenantPicker } from '../form/TenantPicker';
import { unitLabel, UnitPicker } from '../form/UnitPicker';
import { ContractCreated } from './ContractCreated';

type Stage = 'contexto' | 'condiciones' | 'revisar';

const STAGES = [
  { key: 'contexto', label: 'Inquilino y unidad' },
  { key: 'condiciones', label: 'Condiciones' },
  { key: 'revisar', label: 'Revisar' },
] as const satisfies ReadonlyArray<{ key: Stage; label: string }>;

const Fixed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};

  strong {
    font-size: 16px;
    color: ${({ theme }) => theme.color.neutral950};
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_MESSAGES: Record<string, string> = {
  UNIT_NOT_AVAILABLE: 'La unidad ya no está Disponible. Elige otra.',
  UNIT_HAS_CURRENT_OCCUPANCY: 'La unidad ya tiene un contrato actual. Elige otra.',
  UNIT_IN_MAINTENANCE: 'La unidad está En mantenimiento: no puede recibir un contrato.',
  UNIT_NOT_REVIEWED: 'La unidad todavía no se revisa en su configuración.',
  INVALID_CONTRACT_DURATION: 'Revisa la duración del contrato.',
  INVALID_FIXED_DUE_DAY: 'Escribe un día de pago del 1 al 31.',
  TENANT_NOT_FOUND: 'Ese inquilino ya no está disponible. Elige otro.',
};

const FIELD_MESSAGES = {
  start_date: 'Revisa la fecha de inicio: no puede ser posterior a hoy.',
  rent_amount: 'Revisa la renta mensual.',
  fixed_due_day: 'Escribe un día del 1 al 31.',
  deposit_amount: 'Escribe el importe del depósito. Es obligatorio en una renta nueva.',
};

const failureOf = (error: unknown, notSaved: string, marked: boolean): SetupFailure => {
  const result = setupFailure(error, notSaved, marked);
  if (result.tone === 'error' && !marked && isAppError(error) && CODE_MESSAGES[error.code])
    return { ...result, body: `${CODE_MESSAGES[error.code]} Lo que escribiste sigue aquí.` };
  return result;
};

type TenantRef = Pick<Tenant, 'id' | 'first_name' | 'last_name' | 'phone'>;
type UnitRef = Pick<UnitSummary, 'id' | 'name' | 'property'>;

const fullName = (tenant: Pick<Tenant, 'first_name' | 'last_name'>) =>
  `${tenant.first_name} ${tenant.last_name}`;

/** C-07 a C-10: Crear contrato desde una unidad Disponible (U-01) o desde un inquilino (T-03). */
export function CreateContractPage() {
  const [params] = useSearchParams();
  const unitId = params.get('unidad') ?? undefined;
  const tenantId = params.get('inquilino') ?? undefined;
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const unitQuery = useUnit(unitId);
  const tenantQuery = useTenant(tenantId);
  const previewMutation = usePreviewContract();
  const create = useCreateContract();
  const [stage, setStage] = useState<Stage>('contexto');
  const [pickedTenant, setPickedTenant] = useState<TenantRef | null>(null);
  const [pickedUnit, setPickedUnit] = useState<UnitSummary | null>(null);
  const [preview, setPreview] = useState<CreationPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const [created, setCreated] = useState<CreatedContract | null>(null);
  const form = useForm<ContractValues>({ defaultValues: EMPTY_CONTRACT });

  const fromUnit = Boolean(unitId);
  const origin = fromUnit ? unitQuery : tenantQuery;
  const fallback = fromUnit ? '/propiedades' : '/inquilinos';

  if (!unitId && !tenantId)
    return (
      <StateMessage
        kind="empty"
        title="Empieza desde una unidad o un inquilino"
        description="Crear contrato se abre desde una unidad Disponible o desde el detalle del inquilino."
      />
    );
  if (origin.isPending) return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
  if (origin.isError)
    return (
      <>
        <ReturnLink to={fallback} label="Volver" />
        <SectionError onRetry={() => void origin.refetch()} retrying={origin.isFetching} />
      </>
    );

  const fixedUnit = unitQuery.data?.data;
  const fixedTenant = tenantQuery.data?.data;
  const unit: UnitRef | null = fixedUnit ?? pickedUnit;
  const tenant: TenantRef | null = fixedTenant ?? pickedTenant;
  const back = fixedUnit
    ? {
        to: `/unidades/${fixedUnit.id}`,
        label: `Volver a ${unitLabel(fixedUnit)}`,
      }
    : {
        to: `/inquilinos/${fixedTenant?.id ?? ''}`,
        label: `Volver a ${fixedTenant ? fullName(fixedTenant) : 'Inquilinos'}`,
      };

  if (created) return <ContractCreated contract={created} back={back} />;

  // La unidad solo recibe un contrato si está Disponible y revisada (U-01).
  if (fixedUnit && (fixedUnit.status !== 'available' || !fixedUnit.reviewed_at))
    return (
      <>
        <ReturnLink to={back.to} label={unitLabel(fixedUnit)} />
        <StateMessage
          kind="empty"
          title={`${unitLabel(fixedUnit)} no puede recibir un contrato`}
          description="Solo una unidad Disponible puede rentarse. Si está En mantenimiento, márcala como disponible primero."
        />
      </>
    );

  const toInput = (values: ContractValues): NewContractInput => ({
    unit_id: unit?.id ?? '',
    tenant_id: tenant?.id ?? '',
    contract_type: values.contract_type,
    duration_months: durationOf(values),
    rent_amount: toAmount(values.rent_amount),
    deposit_required: true,
    deposit_amount: toAmount(values.deposit_amount),
    start_date: values.start_date,
    fixed_due_day: Number(values.fixed_due_day),
  });

  const requestReview = form.handleSubmit(async values => {
    setFailure(null);
    setChanged(false);
    try {
      const { data } = await previewMutation.mutateAsync(toInput(values));
      setPreview(data);
      setStage('revisar');
    } catch (error) {
      const marked = applyFieldErrors(error, form.setError, FIELD_MESSAGES);
      setFailure(failureOf(error, 'No pudimos revisar el contrato.', marked));
    }
  });

  const save = async () => {
    if (!preview || !tenant) return;
    setFailure(null);
    try {
      const { data } = await create.mutateAsync({
        ...toInput(form.getValues()),
        preview_token: preview.preview_token,
      });
      setCreated(data);
      void events.contractCreated(tenant.id);
    } catch (error) {
      if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
        // Nada se guardó: se muestra la revisión nueva (C-14) y se confirma otra vez.
        setPreview(error.details.preview as CreationPreview);
        setChanged(true);
        return;
      }
      setFailure(failureOf(error, 'No creamos el contrato.', false));
    }
  };

  const context = [tenant ? fullName(tenant) : null, unit ? unitLabel(unit) : null]
    .filter(Boolean)
    .join(' · ');
  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    contexto: { label: 'Cancelar', onClick: () => void navigate(back.to) },
    condiciones: { label: 'Inquilino y unidad', onClick: () => setStage('contexto') },
    revisar: { label: 'Condiciones', onClick: () => setStage('condiciones') },
  };

  const occupancies = fixedTenant?.current_contracts ?? [];

  return (
    <SetupLayout
      step={stage}
      steps={STAGES}
      done={{ contexto: stage !== 'contexto', condiciones: stage === 'revisar' }}
      title="Crear contrato"
      subtitle={context || undefined}
      back={backs[stage]}
      saving={create.isPending}
    >
      <StepPanel>
        {stage === 'contexto' ? (
          fixedUnit ? (
            <>
              <Fixed>
                Unidad
                <strong>{unitLabel(fixedUnit)}</strong>
                Disponible
              </Fixed>
              <TenantPicker
                unitName={unitLabel(fixedUnit)}
                question={`¿Quién va a rentar ${unitLabel(fixedUnit)}?`}
                continueLabel="Continuar con las condiciones"
                selectedId={pickedTenant?.id ?? null}
                onSelect={selected => {
                  setPickedTenant(selected);
                  setPreview(null);
                }}
                onContinue={() => setStage('condiciones')}
              />
            </>
          ) : fixedTenant ? (
            <>
              <Fixed>
                Inquilino
                <strong>{fullName(fixedTenant)}</strong>
                {formatPhone(fixedTenant.phone)} ·{' '}
                {occupancies.length === 0
                  ? 'No renta ninguna unidad actualmente'
                  : `Actualmente renta ${occupancies.length} ${occupancies.length === 1 ? 'unidad' : 'unidades'}`}
              </Fixed>
              {occupancies.length > 0 ? (
                <Hint>
                  {fullName(fixedTenant)} ya renta{' '}
                  {joinNames(
                    occupancies.map(item => placeName(item.unit.name, item.unit.property)),
                  )}
                  . Puede rentar también otra unidad Disponible.
                </Hint>
              ) : null}
              <UnitPicker
                tenantName={fullName(fixedTenant)}
                selected={pickedUnit}
                onSelect={selected => {
                  setPickedUnit(selected);
                  setPreview(null);
                }}
                onContinue={() => setStage('condiciones')}
              />
            </>
          ) : null
        ) : stage === 'condiciones' ? (
          <ContractFields
            mode="new"
            context={context}
            form={form}
            failure={failure}
            reviewing={previewMutation.isPending}
            onReview={() => void requestReview()}
          />
        ) : preview ? (
          <RentReview
            mode="new"
            preview={preview}
            tenantPhone={tenant?.phone ?? null}
            changed={changed}
            failure={failure}
            saving={create.isPending}
            onSave={() => void save()}
            onChangeTenant={() => setStage('contexto')}
            onChangeData={() => {
              setFailure(null);
              setStage('condiciones');
            }}
          />
        ) : null}
      </StepPanel>
    </SetupLayout>
  );
}
