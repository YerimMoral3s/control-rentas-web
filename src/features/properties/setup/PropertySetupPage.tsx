import { Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import { ReturnLink, SectionError, Skeleton, StateMessage } from '@components';
import { useProperty } from '@hooks/querys/properties';
import { useAllPropertyUnits } from '@hooks/querys/units';
import { useRentedDrafts } from '@stores';
import { theme as tokens } from '@styles/theme';
import { ReviewStep } from './components/ReviewStep';
import { SetupDone } from './components/SetupDone';
import { StatesStep } from './components/StatesStep';
import { TypeAndDataStep } from './components/TypeAndDataStep';
import { UnitsStep } from './components/UnitsStep';
import { useSetupNavigation } from './setupNavigation';
import { firstPendingStep, isSetupStep, setupPending } from './setupText';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/** P-13 y pasos 1 a 4 de una propiedad ya creada; sin paso abre el primero pendiente. */
export function PropertySetupPage() {
  const { propertyId, step } = useParams();
  const nav = useSetupNavigation();
  const property = useProperty(propertyId);
  const units = useAllPropertyUnits(propertyId);
  const rentedIds = useRentedDrafts(state => state.unitIds);
  const back = <ReturnLink to="/propiedades" label="Propiedades" />;

  if (property.isPending || units.isPending) {
    return (
      <Page aria-busy="true">
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="320px" $radius={tokens.radius.panel} />
      </Page>
    );
  }

  if (property.isError || units.isError) {
    const notFound = property.isError && property.error.type === 'not_found';
    return (
      <Page>
        {back}
        {notFound ? (
          <StateMessage
            kind="empty"
            title="No encontramos esta propiedad"
            description="Puede que se haya eliminado. Vuelve a la lista para buscarla."
          />
        ) : (
          <SectionError
            onRetry={() => {
              void property.refetch();
              void units.refetch();
            }}
            retrying={property.isFetching || units.isFetching}
          />
        )}
      </Page>
    );
  }

  const data = property.data.data;
  // La API no documenta el orden de las unidades: se muestran por nombre en orden natural.
  const items = [...units.data.data].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { numeric: true }),
  );

  if (data.configuration_status === 'completed') {
    // Recién completada desde Revisar (la consulta se actualiza antes de cambiar de ruta) o en P-12.
    if (step === 'listo' || step === 'revisar') return <SetupDone property={data} units={items} />;
    // Ya completa: los cambios se hacen desde su detalle (fase 4D).
    return <Navigate to={`/propiedades/${data.id}`} replace />;
  }

  if (!isSetupStep(step)) {
    return (
      <Navigate
        to={nav.stepPath(data.id, firstPendingStep(data, setupPending(items, rentedIds)))}
        replace
      />
    );
  }

  // Sin unidades no se puede revisar estados ni completar: se vuelve a Unidades.
  if ((step === 'estados' || step === 'revisar') && items.length === 0)
    return <Navigate to={nav.stepPath(data.id, 'unidades')} replace />;

  switch (step) {
    case 'tipo':
      return <TypeAndDataStep key={data.updated_at} property={data} units={items} />;
    case 'unidades':
      return <UnitsStep property={data} units={items} />;
    case 'estados':
      return <StatesStep property={data} units={items} />;
    case 'revisar':
      return (
        <ReviewStep
          property={data}
          units={items}
          onRefresh={() => {
            void property.refetch();
            void units.refetch();
          }}
        />
      );
  }
}

/** P-05: alta nueva desde Propiedades o desde Inicio (H-10). */
export function PropertyNewPage() {
  return <TypeAndDataStep />;
}
