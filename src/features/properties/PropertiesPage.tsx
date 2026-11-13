import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useDebounce } from 'use-debounce';
import { Button, ListFooter, SearchField, SectionError, Skeleton, StateMessage } from '@components';
import { useProperties } from '@hooks/querys/properties';
import { media, theme as tokens } from '@styles/theme';
import {
  IncompletePropertyRow,
  List,
  ListHeader,
  PropertyRow,
  TableBox,
} from './components/PropertyList';

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

const Lists = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/** P-01: incompletas primero (con su avance) y después las completas, con scroll infinito. */
export function PropertiesPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const setSearch = (value: string) =>
    setParams(value ? { q: value } : {}, { replace: true, preventScrollReset: true });
  const [debouncedSearch] = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const incomplete = useProperties('in_progress', debouncedSearch);
  const complete = useProperties('completed', debouncedSearch);

  const header = (
    <>
      <Head>
        <h1>Propiedades</h1>
        {/* Alta de propiedad: recorrido de la fase 4; deshabilitado sin simular. */}
        <Button icon="plus" disabled title="Disponible próximamente">
          Agregar propiedad
        </Button>
      </Head>
      <Search>
        <SearchField
          value={search}
          onChange={setSearch}
          label="Buscar propiedad o unidad"
          placeholder="Buscar propiedad o unidad"
        />
      </Search>
    </>
  );

  let content;
  if (incomplete.isPending || complete.isPending) {
    content = (
      <List aria-busy="true" aria-label="Cargando propiedades">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton as="li" key={index} $height="64px" $radius={tokens.radius.card} />
        ))}
      </List>
    );
  } else if (complete.isError && !complete.data) {
    content = (
      <SectionError onRetry={() => void complete.refetch()} retrying={complete.isFetching} />
    );
  } else if (incomplete.items.length === 0 && complete.items.length === 0) {
    content = debouncedSearch ? (
      <StateMessage
        kind="empty"
        title={`No encontramos “${debouncedSearch}”`}
        description="Prueba con otro nombre de propiedad, unidad o dirección."
        action={
          <Button variant="secondary" onClick={() => setSearch('')}>
            Limpiar búsqueda
          </Button>
        }
      />
    ) : (
      <StateMessage
        kind="empty"
        title="Aún no hay propiedades registradas"
        description="Agrega tu primera propiedad, sus unidades y quién las renta."
      />
    );
  } else {
    content = (
      <Lists aria-busy={complete.isPlaceholderData || incomplete.isPlaceholderData || undefined}>
        {incomplete.items.length > 0 ? (
          <List aria-label="Propiedades incompletas">
            {incomplete.items.map(property => (
              <IncompletePropertyRow key={property.id} property={property} />
            ))}
          </List>
        ) : null}
        {incomplete.hasNextPage || incomplete.isFetchNextPageError ? (
          <ListFooter
            query={incomplete}
            endLabel=""
            errorLabel="No pudimos cargar más propiedades incompletas"
          />
        ) : null}
        {complete.items.length > 0 ? (
          <TableBox>
            <ListHeader aria-hidden="true">
              <span>Propiedad</span>
              <span>Tipo</span>
              <span>Unidades</span>
              <span>Estado</span>
              <span />
            </ListHeader>
            <List $inBox aria-label="Propiedades">
              {complete.items.map(property => (
                <PropertyRow key={property.id} property={property} />
              ))}
            </List>
          </TableBox>
        ) : null}
        <ListFooter
          query={complete}
          endLabel="No hay más propiedades"
          errorLabel="No pudimos cargar más propiedades"
        />
      </Lists>
    );
  }

  return (
    <Page>
      {header}
      {content}
    </Page>
  );
}
