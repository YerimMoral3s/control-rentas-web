import { useLocation, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import { BackLink, Button, Icon, SectionError, Skeleton, StateMessage } from '@components';
import { useTenant } from '@hooks/querys/tenants';
import { formatPhone } from '@lib/format';
import { media, theme as tokens } from '@styles/theme';
import { CurrentUnitsSection, HistorySection } from './components/ContractSections';
import { OverdueSection } from './components/OverdueSection';
import { fullName, propertyTypes, rentingLine } from './tenantText';

const Page = styled.div`
  width: 100%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 34px;
  }
`;

const Subtitle = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Contact = styled.dl`
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 24px;
  font-size: 15px;

  div {
    display: flex;
    gap: 6px;
  }

  dt {
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-weight: 600;
  }
`;

const Actions = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;

  ${media.desktop} {
    display: flex;
  }
`;

type BackState = { listSearch?: string } | null;

/** T-03 / T-04 / T-05: detalle de inquilino. Cada bloque carga y falla por separado. */
export function TenantDetailPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backState = location.state as BackState;
  const query = useTenant(tenantId);

  // Si se llegó desde la lista, Volver regresa a ella con su búsqueda y posición.
  const back = (
    <BackLink
      to={`/inquilinos${backState?.listSearch ?? ''}`}
      onClick={event => {
        if (backState) {
          event.preventDefault();
          void navigate(-1);
        }
      }}
    >
      <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
      Inquilinos
    </BackLink>
  );

  if (query.isPending) {
    return (
      <Page aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="60%" />
        <Skeleton $height="160px" $radius={tokens.radius.card} />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage
            kind="empty"
            title="No encontramos a este inquilino"
            description="Puede que se haya eliminado. Vuelve a la lista para buscarlo."
          />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </Page>
    );
  }

  const tenant = query.data.data;
  const renting = tenant.current_contracts.length > 0;
  const types = propertyTypes(tenant);

  return (
    <Page>
      {back}
      <Header>
        <h1>{fullName(tenant)}</h1>
        <Subtitle>{rentingLine(tenant)}</Subtitle>
        <Contact>
          <div>
            <dt>Teléfono</dt>
            <dd>{formatPhone(tenant.phone)}</dd>
          </div>
          {tenant.secondary_phone ? (
            <div>
              <dt>Otro teléfono</dt>
              <dd>{formatPhone(tenant.secondary_phone)}</dd>
            </div>
          ) : null}
          {tenant.alias ? (
            <div>
              <dt>También le dicen</dt>
              <dd>{tenant.alias}</dd>
            </div>
          ) : null}
        </Contact>
        {/* Acciones de escritura de fases 4 y 5: visibles pero deshabilitadas, sin simular. */}
        <Actions>
          <Button
            variant={renting ? 'secondary' : 'primary'}
            disabled
            title="Disponible próximamente"
          >
            Crear contrato
          </Button>
          <Button variant="neutral" disabled title="Disponible próximamente">
            Editar
          </Button>
          <Button
            variant="neutral"
            disabled
            title="Disponible próximamente"
            aria-label="Más acciones"
          >
            <Icon name="more" size={20} />
          </Button>
        </Actions>
      </Header>
      <OverdueSection tenant={tenant} />
      <CurrentUnitsSection
        tenantId={tenant.id}
        types={types}
        count={tenant.current_contracts.length}
      />
      <HistorySection tenantId={tenant.id} types={types} />
    </Page>
  );
}
