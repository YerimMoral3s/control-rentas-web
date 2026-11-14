import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Notice, ReturnLink, SectionError, Skeleton, StateMessage, StatusBadge } from '@components';
import { useResultNotice } from '@lib/useResultNotice';
import { useUnit } from '@hooks/querys/units';
import { theme as tokens } from '@styles/theme';
import { DetailHeader, DetailPage } from './components/DetailHeader';
import { DeleteUnitDialog } from './components/DeleteUnitDialog';
import { UnitBody } from './components/UnitBody';
import { isSingleUnit, unitTypeLabel } from './propertyText';

/** U-01 a U-03: detalle de unidad según su estado. */
export function UnitDetailPage() {
  const { unitId } = useParams();
  const query = useUnit(unitId);
  const unit = query.data?.data;
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { result, dismiss } = useResultNotice();

  const back = unit ? (
    <ReturnLink to={`/propiedades/${unit.property.id}`} label={unit.property.name} />
  ) : (
    <ReturnLink to="/propiedades" label="Propiedades" />
  );

  if (query.isPending) {
    return (
      <DetailPage aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="160px" $radius={tokens.radius.card} />
      </DetailPage>
    );
  }

  if (query.isError || !unit) {
    return (
      <DetailPage>
        {back}
        {query.error?.type === 'not_found' ? (
          <StateMessage
            kind="empty"
            title="No encontramos esta unidad"
            description="Puede que se haya eliminado. Búscala en Propiedades."
          />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </DetailPage>
    );
  }

  // Casa o bodega: su detalle es el de la propiedad (P-04), con sus acciones.
  if (isSingleUnit(unit.property.property_type))
    return <Navigate to={`/propiedades/${unit.property.id}`} replace />;

  return (
    <DetailPage>
      {back}
      <DetailHeader
        title={unit.name}
        subtitle={`${unit.property.name} · ${unitTypeLabel(unit.unit_type)}`}
        badge={unit.status === 'inactive' ? null : <StatusBadge status={unit.status} />}
      />
      {result ? (
        <Notice tone="success" title={result.title} onClose={dismiss}>
          {result.body}
        </Notice>
      ) : null}
      <UnitBody
        unit={unit}
        name={unit.name}
        menu={[
          { label: 'Editar unidad', onSelect: () => void navigate(`/unidades/${unit.id}/editar`) },
          { label: 'Eliminar unidad', danger: true, onSelect: () => setDeleting(true) },
        ]}
      />
      <DeleteUnitDialog unit={unit} open={deleting} onClose={() => setDeleting(false)} />
    </DetailPage>
  );
}
