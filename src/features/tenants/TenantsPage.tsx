import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useDebounce } from 'use-debounce';
import { Button, ListFooter, SearchField, SectionError, Skeleton, StateMessage } from '@components';
import { useTenants } from '@hooks/querys/tenants';
import { useMediaQuery } from '@lib/useMediaQuery';
import { media, theme as tokens } from '@styles/theme';
import {
  Cards,
  Table,
  TenantCard,
  TenantLinkRow,
  TenantSelectRow,
  TenantTableHeader,
} from './components/TenantList';
import { TenantQuickView } from './components/TenantQuickView';

const SEARCH_DEBOUNCE_MS = 350;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.desktop} {
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
    font-size: 28px;
    line-height: 34px;
  }
`;

const Search = styled.div`
  ${media.desktop} {
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

/** Crear inquilino es una escritura de la fase 4: se muestra deshabilitado, sin simular. */
function CreateTenantButton() {
  return (
    <Button icon="plus" disabled title="Disponible próximamente">
      Crear inquilino
    </Button>
  );
}

/** T-01 y T-02: lista de inquilinos con búsqueda del servidor, scroll infinito y vista rápida. */
export function TenantsPage() {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  const isWide = useMediaQuery(`(min-width: ${tokens.breakpoint.wide})`);
  // La búsqueda vive en la URL: al volver del detalle se conserva.
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const setSearch = (value: string) =>
    setParams(value ? { q: value } : {}, { replace: true, preventScrollReset: true });
  const [debouncedSearch] = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const query = useTenants(debouncedSearch);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = query.items;
  const selected = isWide ? items.find(tenant => tenant.id === selectedId) : undefined;

  const closeQuickView = () => {
    const id = selectedId;
    setSelectedId(null);
    // El foco vuelve a la fila que abrió la vista rápida.
    if (id) document.querySelector<HTMLElement>(`[data-tenant-row="${id}"]`)?.focus();
  };

  const header = (
    <>
      <Head>
        <h1>Inquilinos</h1>
        <CreateTenantButton />
      </Head>
      <Search>
        <SearchField
          value={search}
          onChange={setSearch}
          label="Buscar inquilino por nombre o teléfono"
          placeholder="Buscar por nombre o teléfono"
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
    content = debouncedSearch ? (
      <StateMessage
        kind="empty"
        title={`No encontramos “${debouncedSearch}”`}
        description="Prueba con otro nombre o teléfono."
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
      <Layout aria-busy={query.isPlaceholderData || undefined}>
        <ListColumn>
          {list}
          <ListFooter
            query={query}
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
