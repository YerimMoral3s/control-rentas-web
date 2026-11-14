import { useParams } from 'react-router';
import { ReturnLink, SectionError, Skeleton, StateMessage, StatusBadge } from '@components';
import { useUnit } from '@hooks/querys/units';
import { theme as tokens } from '@styles/theme';
import { DetailHeader, DetailPage } from './components/DetailHeader';
import { UnitBody } from './components/UnitBody';
import { unitTypeLabel } from './propertyText';

/** U-01 a U-03: detalle de unidad según su estado. */
export function UnitDetailPage() {
  const { unitId } = useParams();
  const query = useUnit(unitId);
  const unit = query.data?.data;

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

  return (
    <DetailPage>
      {back}
      <DetailHeader
        title={unit.name}
        subtitle={`${unit.property.name} · ${unitTypeLabel(unit.unit_type)}`}
        badge={unit.status === 'inactive' ? null : <StatusBadge status={unit.status} />}
      />
      <UnitBody unit={unit} />
    </DetailPage>
  );
}
