import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ReturnLink, SectionError, Skeleton } from '@components';
import {
  PreexistingRentSteps,
  type PreexistingStage,
} from '@features/contracts/form/PreexistingRentSteps';
import { useProperty } from '@hooks/querys/properties';
import { useAllPropertyUnits, useReviewUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { withResult } from '@lib/useResultNotice';
import { useRentedDrafts } from '@stores';
import { theme as tokens } from '@styles/theme';
import { SetupLayout } from '../components/SetupLayout';
import { StepPanel } from '../components/stepStyles';
import { useSetupNavigation } from '../setupNavigation';
import { isSingleType, propertyTypeOption } from '../setupText';

/** P-10: cargar la renta actual de una unidad marcada Rentada durante la configuración. */
export function CurrentRentPage() {
  const { propertyId, unitId } = useParams();
  const navigate = useNavigate();
  const nav = useSetupNavigation();
  const events = useInvalidateEvents();
  const property = useProperty(propertyId);
  const units = useAllPropertyUnits(propertyId);
  const review = useReviewUnit();
  const unmarkRented = useRentedDrafts(state => state.unmark);
  const [stage, setStage] = useState<PreexistingStage>('tenant');

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

  const onSaved = async (tenantId: string) => {
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
    void events.contractCreated(tenantId);
  };

  const backs: Record<PreexistingStage, { label: string; onClick: () => void }> = {
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
      saving={review.isPending}
      property={data}
    >
      <StepPanel>
        <PreexistingRentSteps
          unitId={unit.id}
          place={place}
          stage={stage}
          onStageChange={setStage}
          onSaved={onSaved}
        />
      </StepPanel>
    </SetupLayout>
  );
}
