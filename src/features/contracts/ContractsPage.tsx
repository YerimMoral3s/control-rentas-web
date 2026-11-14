import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useDebounce } from 'use-debounce';
import type { ContractStatus } from '@api/contracts';
import {
  Button,
  FilterChips,
  ListFooter,
  SearchField,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useContracts } from '@hooks/querys/contracts';
import { useMediaQuery } from '@lib/useMediaQuery';
import { media, theme as tokens } from '@styles/theme';
import {
  Cards,
  ContractCard,
  ContractLinkRow,
  ContractSelectRow,
  ContractTableHeader,
  Table,
} from './components/ContractList';
import { ContractQuickView } from './components/ContractQuickView';

const SEARCH_DEBOUNCE_MS = 350;

type StatusFilter = 'all' | ContractStatus;

const CHIPS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'terminated', label: 'Terminados' },
];

const isStatusFilter = (value: string | null): value is StatusFilter =>
  CHIPS.some(chip => chip.value === value);

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.desktop} {
    gap: 20px;
  }

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

/** C-01 y C-02: contratos con búsqueda y estado en la URL, scroll infinito y vista rápida. */
export function ContractsPage() {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  const isWide = useMediaQuery(`(min-width: ${tokens.breakpoint.wide})`);
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const rawStatus = params.get('estado');
  const status: StatusFilter = isStatusFilter(rawStatus) ? rawStatus : 'all';
  const update = (next: { q?: string; estado?: StatusFilter }) => {
    const q = next.q ?? search;
    const estado = next.estado ?? status;
    setParams(
      { ...(q ? { q } : {}), ...(estado !== 'all' ? { estado } : {}) },
      { replace: true, preventScrollReset: true },
    );
  };
  const [debouncedSearch] = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const query = useContracts({
    ...(status !== 'all' ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = query.items;
  const selected = isWide ? items.find(contract => contract.id === selectedId) : undefined;
  const chipLabel = CHIPS.find(chip => chip.value === status)?.label ?? 'Todos';

  const closeQuickView = () => {
    const id = selectedId;
    setSelectedId(null);
    if (id) document.querySelector<HTMLElement>(`[data-contract-row="${id}"]`)?.focus();
  };

  let content;
  if (query.isPending) {
    content = (
      <Cards aria-busy="true" aria-label="Cargando contratos">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            as="li"
            key={index}
            $height={isDesktop ? '64px' : '128px'}
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
        description={`Buscamos solo en ${chipLabel}. Prueba con otro inquilino, unidad o propiedad.`}
        action={
          <Button variant="secondary" onClick={() => update({ q: '' })}>
            Limpiar búsqueda
          </Button>
        }
      />
    ) : status !== 'all' ? (
      <StateMessage kind="empty" title={`No hay contratos en ${chipLabel}`} />
    ) : (
      <StateMessage
        kind="empty"
        title="Aún no hay contratos"
        description="Cuando registres quién renta cada unidad, aquí verás sus contratos."
      />
    );
  } else {
    const list = !isDesktop ? (
      <Cards>
        {items.map(contract => (
          <ContractCard key={contract.id} contract={contract} />
        ))}
      </Cards>
    ) : (
      <Table>
        <ContractTableHeader />
        {items.map(contract =>
          isWide ? (
            <ContractSelectRow
              key={contract.id}
              contract={contract}
              selected={contract.id === selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <ContractLinkRow key={contract.id} contract={contract} />
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
            endLabel="No hay más contratos"
            errorLabel="No pudimos cargar más contratos"
            skeletonHeight={isDesktop ? '64px' : '128px'}
          />
        </ListColumn>
        {selected ? <ContractQuickView contract={selected} onClose={closeQuickView} /> : null}
      </Layout>
    );
  }

  return (
    <Page>
      <h1>Contratos</h1>
      <Search>
        <SearchField
          value={search}
          onChange={value => update({ q: value })}
          label="Buscar contrato por inquilino, unidad o propiedad"
          placeholder="Buscar inquilino, unidad o propiedad"
        />
      </Search>
      <FilterChips
        label="Filtrar contratos por estado"
        value={status}
        onChange={value => {
          setSelectedId(null);
          update({ estado: value });
        }}
        options={CHIPS.map(chip => ({ ...chip, count: query.meta?.counts[chip.value] }))}
      />
      {content}
    </Page>
  );
}
