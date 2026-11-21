import { Link, useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useDebounce } from 'use-debounce';
import type { HistorySourceType } from '@api/movements';
import {
  Button,
  ButtonLink,
  FilterChips,
  FROM_LIST_STATE,
  ListFooter,
  ReturnLink,
  SearchField,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useMovementsHistory } from '@hooks/querys/movements';
import { clampLines, media, pageTitle, theme as tokens } from '@styles/theme';
import { lastCorrectionLine, originContext, resultLine } from './historyText';

const SEARCH_DEBOUNCE_MS = 350;

type Chip = 'all' | HistorySourceType;

const CHIPS: ReadonlyArray<{ value: Chip; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'payment', label: 'Pagos' },
  { value: 'expense', label: 'Gastos' },
];

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Head = styled.header`
  h1 {
    margin: 0;
    ${pageTitle}
  }

  p {
    margin: 4px 0 0;
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Search = styled.div`
  ${media.table} {
    width: 420px;
  }
`;

const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  overflow: hidden;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const Row = styled(Link)`
  padding: 12px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  strong {
    font-size: 15px;
    line-height: 22px;
    ${clampLines(2)}
  }

  span {
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  b {
    grid-row: 1 / span 3;
    grid-column: 2;
    align-self: center;
    font-size: 14px;
    text-align: right;
    white-space: nowrap;
  }
`;

const isChip = (value: string | null): value is Chip => CHIPS.some(chip => chip.value === value);

/** M-05: pagos y gastos que se corrigieron, incluidos los que ya no tienen resultado vigente. */
export function HistoryListPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const rawChip = params.get('origen');
  const chip: Chip = isChip(rawChip) ? rawChip : 'all';
  const [debouncedSearch] = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const query = useMovementsHistory(chip, debouncedSearch);
  const counts = query.meta?.counts;

  const update = (next: Partial<{ q: string; origen: Chip }>) => {
    const values = { q: search, origen: chip, ...next };
    setParams(
      {
        ...(values.q ? { q: values.q } : {}),
        ...(values.origen !== 'all' ? { origen: values.origen } : {}),
      },
      { replace: true, preventScrollReset: true },
    );
  };

  const header = (
    <>
      <ReturnLink to="/movimientos" label="Movimientos" />
      <Head>
        <h1>Historial de correcciones</h1>
        <p>Consulta pagos y gastos que se corrigieron. Aquí no se cambia nada.</p>
      </Head>
    </>
  );

  // M-07: sin correcciones todavía (y sin búsqueda ni chip).
  if (!debouncedSearch && chip === 'all' && counts?.all === 0)
    return (
      <Page>
        {header}
        <StateMessage
          kind="empty"
          title="Aún no hay correcciones que consultar"
          description="Los movimientos vigentes siguen disponibles en la lista principal."
          action={
            <ButtonLink variant="secondary" to="/movimientos">
              Volver a Movimientos
            </ButtonLink>
          }
        />
      </Page>
    );

  let content;
  if (query.isPending)
    content = (
      <div aria-busy="true" aria-label="Cargando el historial">
        <Skeleton $height="240px" $radius={tokens.radius.card} />
      </div>
    );
  else if (query.isError && !query.data)
    content = (
      <SectionError
        title="No pudimos cargar el historial"
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  else if (query.items.length === 0)
    content = (
      <StateMessage
        kind="empty"
        title={
          debouncedSearch
            ? `No encontramos “${debouncedSearch}”`
            : 'No hay correcciones de este tipo'
        }
        description="Prueba con otra palabra o limpia la búsqueda."
        action={
          <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
            Limpiar búsqueda
          </Button>
        }
      />
    );
  else
    content = (
      <div aria-busy={query.isPlaceholderData || undefined}>
        <Rows>
          {query.items.map(origin => (
            <li key={`${origin.source.type}-${origin.source.id}`}>
              <Row
                to={`/movimientos/historial/${origin.source.type}/${origin.source.id}`}
                state={FROM_LIST_STATE}
              >
                <strong>{origin.latest_posting.concept}</strong>
                <span>{originContext(origin)}</span>
                <span>{lastCorrectionLine(origin)}</span>
                <b>{resultLine(origin)}</b>
              </Row>
            </li>
          ))}
        </Rows>
        <ListFooter
          query={query}
          endLabel="No hay más correcciones"
          errorLabel="No pudimos cargar más correcciones"
        />
      </div>
    );

  return (
    <Page>
      {header}
      <Search>
        <SearchField
          value={search}
          onChange={value => update({ q: value })}
          label="Buscar en el historial por concepto, persona o inmueble"
          placeholder="Buscar concepto, persona o inmueble"
        />
      </Search>
      <FilterChips
        label="Filtrar correcciones"
        value={chip}
        onChange={value => update({ origen: value })}
        options={CHIPS.map(option => ({ ...option, count: counts?.[option.value] }))}
      />
      {content}
    </Page>
  );
}
