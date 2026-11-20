import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ReturnLink, SectionError, Skeleton, StateMessage } from '@components';
import { DetailHeader, DetailPage } from '@features/properties/components/DetailHeader';
import { StepPanel } from '@features/properties/setup/components/stepStyles';
import { useUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import { PreexistingRentSteps, type PreexistingStage } from '../form/PreexistingRentSteps';
import { unitLabel } from '../form/UnitPicker';

/**
 * C-18 Registrar contrato existente desde una unidad Disponible (Más acciones de U-01): un contrato
 * que ya existía antes de usar la app. Mismos pasos de P-10; al guardar, la unidad queda Ocupada.
 */
export function RegisterExistingContractPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const query = useUnit(unitId);
  const [stage, setStage] = useState<PreexistingStage>('tenant');
  const [saved, setSaved] = useState(false);

  if (query.isPending)
    return (
      <DetailPage aria-busy="true">
        <Skeleton $height="320px" $radius={tokens.radius.panel} />
      </DetailPage>
    );
  if (query.isError)
    return (
      <DetailPage>
        <ReturnLink to="/propiedades" label="Propiedades" />
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos esta unidad" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </DetailPage>
    );

  const unit = query.data.data;
  const detail = `/unidades/${unit.id}`;
  const place = unitLabel(unit);
  // Solo una unidad Disponible y revisada recibe un contrato (si se guardó, ya está Ocupada).
  if (!saved && (unit.status !== 'available' || !unit.reviewed_at))
    return <Navigate to={detail} replace />;

  return (
    <DetailPage>
      <ReturnLink to={detail} label={place} />
      <DetailHeader title="Registrar contrato existente" subtitle={place} />
      <StepPanel>
        <PreexistingRentSteps
          unitId={unit.id}
          existing
          place={place}
          stage={stage}
          onStageChange={setStage}
          onSaved={tenantId => {
            setSaved(true);
            void navigate(detail, {
              replace: true,
              state: withResult({
                title: 'Contrato registrado.',
                body: `${place} quedó Ocupada. Los cobros empiezan en el mes en que lo registraste.`,
              }),
            });
            void events.contractCreated(tenantId);
          }}
        />
      </StepPanel>
    </DetailPage>
  );
}
