import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import {
  Button,
  ButtonLink,
  ListFooter,
  Notice,
  SearchField,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useMediaQuery } from '@lib/useMediaQuery';
import { useResultNotice } from '@lib/useResultNotice';
import { media, theme as tokens, pageTitle } from '@styles/theme';
import {
  Cards,
  Table,
  TenantCard,
  TenantLinkRow,
  TenantSelectRow,
  TenantTableHeader,
} from './components/TenantList';
import { TenantQuickView } from './components/TenantQuickView';
import { useTenantSearch } from './catalog/useTenantSearch';

/** Se muestran de 20 en 20 al hacer scroll (la lista completa ya está en el catálogo). */
const PAGE = 20;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.table} {
    gap: 24px;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h1 {
    margin: 0;
    ${pageTitle}
  }
`;

const Search = styled.div`
  ${media.table} {
    width: 420px;
  }
`;

const Layout = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

const ListColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

function CreateTenantButton() {
  return (
    <ButtonLink icon="plus" to="/inquilinos/nuevo">
      Crear inquilino
    </ButtonLink>
  );
}

/**
 * T-01 y T-02: lista de inquilinos con vista rápida. Usa el catálogo completo (acuerdo del 14 nov.):
 * búsqueda local con MiniSearch al escribir y scroll infinito sin pedir más al servidor.
 */
export function TenantsPage() {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.table})`);
  const isWide = useMediaQuery(`(min-width: ${tokens.breakpoint.wide})`);
  // La búsqueda vive en la URL: al volver del detalle se conserva.
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const setSearch = (value: string) =>
    setParams(value ? { q: value } : {}, { replace: true, preventScrollReset: true });
  const term = search.trim();
  const { catalog: query, results } = useTenantSearch(term, { byName: true });
  // Cuántos se muestran para la búsqueda actual; una búsqueda nueva vuelve a los primeros 20.
  const [paging, setPaging] = useState({ term, count: PAGE });
  const visible = paging.term === term ? paging.count : PAGE;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { result, dismiss } = useResultNotice();

  const items = results.slice(0, visible);
  const more = {
    hasNextPage: visible < results.length,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    fetchNextPage: () => setPaging({ term, count: visible + PAGE }),
  };
  const selected = isWide ? items.find(tenant => tenant.id === selectedId) : undefined;

  const closeQuickView = () => {
    const id = selectedId;
    setSelectedId(null);
    // El foco vuelve a la fila que abrió la vista rápida.
    if (id) document.querySelector<HTMLElement>(`[data-tenant-row="${id}"]`)?.focus();
  };

  const header = (
    <>
      {result ? (
        <Notice tone="success" title={result.title} onClose={dismiss}>
          {result.body}
        </Notice>
      ) : null}
      <Head>
        <h1>Inquilinos</h1>
        <CreateTenantButton />
      </Head>
      <Search>
        <SearchField
          value={search}
          onChange={setSearch}
          label="Buscar inquilino por nombre, teléfono o unidad"
          placeholder="Buscar por nombre, teléfono o unidad"
        />
      </Search>
    </>
  );

  let content;
  if (query.isPending) {
    content = (
      <Cards aria-busy="true" aria-label="Cargando inquilinos">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            as="li"
            key={index}
            $height={isDesktop ? '64px' : '112px'}
            $radius={tokens.radius.card}
          />
        ))}
      </Cards>
    );
  } else if (query.isError && !query.data) {
    content = <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  } else if (items.length === 0) {
    content = term ? (
      <StateMessage
        kind="empty"
        title={`No encontramos “${term}”`}
        description="Prueba con otro nombre, teléfono o unidad."
        action={
          <Button variant="secondary" onClick={() => setSearch('')}>
            Limpiar búsqueda
          </Button>
        }
      />
    ) : (
      <StateMessage
        kind="empty"
        title="Aún no hay inquilinos registrados"
        description="Cuando agregues a las personas que te rentan, aquí verás su contacto y sus pagos."
        action={<CreateTenantButton />}
      />
    );
  } else {
    const list = !isDesktop ? (
      <Cards>
        {items.map(tenant => (
          <TenantCard key={tenant.id} tenant={tenant} />
        ))}
      </Cards>
    ) : (
      <Table>
        <TenantTableHeader />
        {items.map(tenant =>
          isWide ? (
            <TenantSelectRow
              key={tenant.id}
              tenant={tenant}
              selected={tenant.id === selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <TenantLinkRow key={tenant.id} tenant={tenant} />
          ),
        )}
      </Table>
    );
    content = (
      <Layout>
        <ListColumn>
          {list}
          <ListFooter
            query={more}
            endLabel="No hay más inquilinos"
            errorLabel="No pudimos cargar más inquilinos"
            skeletonHeight={isDesktop ? '64px' : '112px'}
          />
        </ListColumn>
        {selected ? <TenantQuickView tenant={selected} onClose={closeQuickView} /> : null}
      </Layout>
    );
  }

  return (
    <Page>
      {header}
      {content}
    </Page>
  );
}
