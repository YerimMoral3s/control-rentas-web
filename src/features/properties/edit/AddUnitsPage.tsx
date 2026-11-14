import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import type { UnitType } from '@api/units';
import { ReturnLink, SectionError, Skeleton } from '@components';
import { useProperty } from '@hooks/querys/properties';
import { useAllPropertyUnits } from '@hooks/querys/units';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import { BulkUnitsForm } from '../setup/components/BulkUnitsForm';
import { StepPanel } from '../setup/components/stepStyles';
import { groupCount, groupTypesFor, isSingleType } from '../setup/setupText';
import { propertyTypeLabel, unitCountLabel } from '../propertyText';
import { DetailHeader, DetailPage } from '../components/DetailHeader';

/**
 * P-14 Agregar unidades después (desde P-03). Usa P-08; al crearlas la propiedad vuelve a estar
 * incompleta (BACK), así que sigue en Estados para revisar las nuevas y completar de nuevo.
 */
export function AddUnitsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const property = useProperty(propertyId);
  const units = useAllPropertyUnits(propertyId);
  const [unitType, setUnitType] = useState<UnitType | null>(null);
  const detail = `/propiedades/${propertyId ?? ''}`;
  const back = <ReturnLink to={detail} label={property.data?.data.name ?? 'Volver'} />;

  if (property.isPending || units.isPending)
    return (
      <DetailPage aria-busy="true">
        {back}
        <Skeleton $height="320px" $radius={tokens.radius.panel} />
      </DetailPage>
    );
  if (property.isError || units.isError)
    return (
      <DetailPage>
        {back}
        <SectionError
          onRetry={() => {
            void property.refetch();
            void units.refetch();
          }}
          retrying={property.isFetching || units.isFetching}
        />
      </DetailPage>
    );

  const data = property.data.data;
  // No aparece en casa ni bodega.
  if (isSingleType(data.property_type)) return <Navigate to={detail} replace />;

  return (
    <DetailPage>
      {back}
      <DetailHeader
        title="Agregar unidades"
        subtitle={`${data.name} · ${propertyTypeLabel(data.property_type)} · ${unitCountLabel(data.unit_counts.total)}`}
      />
      <StepPanel>
        <BulkUnitsForm
          property={data}
          units={units.data.data}
          unitType={unitType ?? groupTypesFor(data.property_type)[0] ?? 'commercial_space'}
          onUnitTypeChange={setUnitType}
          onClose={() => void navigate(detail)}
          closeLabel={`Volver a ${data.name}`}
          onCreated={created =>
            void navigate(`/propiedades/${data.id}/configurar/estados`, {
              replace: true,
              state: withResult({
                title: `Agregamos ${groupCount(created.unitType, created.count)} a ${data.name}.`,
                body: `Elige su estado para que ${data.name} vuelva a aparecer en Inicio.`,
              }),
            })
          }
        />
      </StepPanel>
    </DetailPage>
  );
}
