import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { CreationPreview, PreexistingContractInput } from '@api/contracts';
import type { Tenant } from '@api/tenants';
import { ReturnLink, SectionError, Skeleton } from '@components';
import {
  useCreatePreexistingContract,
  usePreviewPreexistingContract,
} from '@hooks/querys/contracts';
import { useProperty } from '@hooks/querys/properties';
import { useAllPropertyUnits, useReviewUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { contractEndDate } from '@lib/dates';
import { applyFieldErrors } from '@lib/formErrors';
import { withResult } from '@lib/useResultNotice';
import { useRentedDrafts } from '@stores';
import { theme as tokens } from '@styles/theme';
import { SetupLayout } from '../components/SetupLayout';
import { StepPanel } from '../components/stepStyles';
import { setupFailure, type SetupFailure } from '../setupFailure';
import { useSetupNavigation } from '../setupNavigation';
import { isSingleType, propertyTypeOption } from '../setupText';
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

type Stage = 'tenant' | 'contract' | 'review';

const STAGES: ReadonlyArray<{ key: Stage; label: string }> = [
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
  UNIT_HAS_CURRENT_OCCUPANCY: 'Esta unidad ya tiene su renta actual. Vuelve a Estados para verla.',
  UNIT_IN_MAINTENANCE: 'La unidad está En mantenimiento. Vuelve a Estados y márcala como Rentada.',
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

/** P-10 / C-18: cargar la renta actual de una unidad marcada Rentada durante la configuración. */
export function CurrentRentPage() {
  const { propertyId, unitId } = useParams();
  const navigate = useNavigate();
  const nav = useSetupNavigation();
  const events = useInvalidateEvents();
  const property = useProperty(propertyId);
  const units = useAllPropertyUnits(propertyId);
  const previewMutation = usePreviewPreexistingContract();
  const create = useCreatePreexistingContract();
  const review = useReviewUnit();
  const unmarkRented = useRentedDrafts(state => state.unmark);
  const [stage, setStage] = useState<Stage>('tenant');
  const [tenant, setTenant] = useState<Pick<Tenant, 'id' | 'phone'> | null>(null);
  const [preview, setPreview] = useState<CreationPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const form = useForm<ContractValues>({ defaultValues: EMPTY_CONTRACT });

  if (property.isPending || units.isPending)
    return <Skeleton $height="320px" $radius={tokens.radius.panel} />;
  if (property.isError || units.isError)
    return (
      <>
        <ReturnLink to="/propiedades" label="Propiedades" />
        <SectionError
          onRetry={() => {
            void property.refetch();
            void units.refetch();
          }}
          retrying={property.isFetching || units.isFetching}
        />
      </>
    );

  const data = property.data.data;
  const unit = units.data.data.find(item => item.id === unitId);
  const estados = nav.stepPath(data.id, 'estados');
  // Ya completa, unidad inexistente o que ya tiene su renta: vuelve a Estados.
  if (data.configuration_status === 'completed' || !unit || unit.status === 'occupied')
    return <Navigate to={estados} replace />;

  const single = isSingleType(data.property_type);
  const place = single ? data.name : unit.name;

  const toInput = (values: ContractValues): PreexistingContractInput => {
    const deposit = depositRequired(values);
    return {
      unit_id: unit.id,
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
      const { data: result } = await previewMutation.mutateAsync(toInput(values));
      setPreview(result);
      setStage('review');
    } catch (error) {
      const marked = applyFieldErrors(error, form.setError, FIELD_MESSAGES);
      setFailure(failureOf(error, 'No pudimos revisar la renta actual.', marked));
    }
  });

  const save = async () => {
    if (!preview) return;
    setFailure(null);
    const input = toInput(form.getValues());
    try {
      await create.mutateAsync({ ...input, preview_token: preview.preview_token });
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
    unmarkRented(unit.id);
    let confirmed = true;
    try {
      // La renta ya existe: ahora se confirma que la unidad está Rentada (BACK lo exige así).
      await review.mutateAsync({ unitId: unit.id, status: 'occupied' });
    } catch {
      confirmed = false;
    }
    void navigate(estados, {
      replace: true,
      state: withResult(
        confirmed
          ? { title: 'Renta actual guardada.', body: `${place} ya no tiene tareas pendientes.` }
          : {
              title: 'Renta actual guardada.',
              body: `Falta confirmar el estado de ${place}: elige Rentada en la lista.`,
            },
      ),
    });
    // Después de salir: al refrescar, esta pantalla ya no aplica (la unidad está Ocupada).
    void events.preexistingContractCreated(input.tenant_id);
  };

  const backs: Record<Stage, { label: string; onClick: () => void }> = {
    tenant: { label: 'Estados', onClick: () => void navigate(estados) },
    contract: { label: 'Inquilino', onClick: () => setStage('tenant') },
    review: { label: 'Contrato', onClick: () => setStage('contract') },
  };

  return (
    <SetupLayout
      step="estados"
      done={{ tipo: true, unidades: true }}
      stepTo={step => nav.stepPath(data.id, step)}
      title={`Renta actual de ${place}`}
      subtitle={single ? propertyTypeOption(data.property_type).title : data.name}
      back={backs[stage]}
      onSaveExit={nav.exit}
      saving={create.isPending || review.isPending}
      property={data}
    >
      <StepPanel>
        <Stages aria-label="Renta actual">
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
            onContinue={() => setStage('contract')}
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
            tenantPhone={tenant?.phone ?? null}
            changed={changed}
            failure={failure}
            saving={create.isPending || review.isPending}
            onSave={() => void save()}
            onChangeTenant={() => setStage('tenant')}
            onChangeData={() => {
              setFailure(null);
              setStage('contract');
            }}
          />
        ) : null}
      </StepPanel>
    </SetupLayout>
  );
}
