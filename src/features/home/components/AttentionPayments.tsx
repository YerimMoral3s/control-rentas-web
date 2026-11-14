import { useState } from 'react';
import styled from 'styled-components';
import { useDebounce } from 'use-debounce';
import type { AttentionCategory, Payment } from '@api/payments';
import { Button, FilterChips, ListFooter, SearchField, Skeleton, StateMessage } from '@components';
import { useAttentionPayments } from '@hooks/querys/payments';
import { useMediaQuery } from '@lib/useMediaQuery';
import { media, theme as tokens } from '@styles/theme';
import { PaymentCard } from './PaymentCard';
import { PaymentRow, PaymentTableHeader, Table } from './PaymentTable';
import { SectionError } from './SectionError';

const SEARCH_DEBOUNCE_MS = 350;

const CHIPS: ReadonlyArray<{ value: AttentionCategory; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'upcoming', label: 'Por vencer' },
  { value: 'rest_of_month', label: 'Resto del mes' },
];

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${media.wide} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    > div {
      width: 420px;
    }
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
`;

const Cards = styled.div`
  display: grid;
  gap: 12px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const chipName = (category: AttentionCategory) =>
  CHIPS.find(chip => chip.value === category)?.label ?? 'Todos';

function LoadingList({ wide }: { wide: boolean }) {
  return (
    <Cards aria-busy="true" aria-label="Cargando pagos por atender">
      {Array.from({ length: wide ? 4 : 2 }, (_, index) => (
        <Skeleton key={index} $height={wide ? '64px' : '196px'} $radius={tokens.radius.card} />
      ))}
    </Cards>
  );
}

/** H-06 a H-08 y H-11: cobros por atender con búsqueda, chips con conteo y scroll infinito. */
export function AttentionPayments() {
  const isWide = useMediaQuery(`(min-width: ${tokens.breakpoint.wide})`);
  const [category, setCategory] = useState<AttentionCategory>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const query = useAttentionPayments(category, debouncedSearch);

  const meta = query.meta;
  const today = meta?.as_of_date;
  const counts = meta?.attention_counts;
  const nothingPending = !debouncedSearch && counts?.all === 0;

  const header = (
    <Head>
      <Title>Pagos por atender</Title>
      {nothingPending ? null : (
        <SearchField
          value={search}
          onChange={setSearch}
          label="Buscar por inquilino, teléfono, propiedad, unidad o concepto"
          placeholder="Buscar inquilino, unidad o concepto"
        />
      )}
    </Head>
  );

  if (query.isPending) {
    return (
      <Section aria-label="Pagos por atender">
        {header}
        <LoadingList wide={isWide} />
      </Section>
    );
  }

  if (query.isError && !query.data) {
    return (
      <Section aria-label="Pagos por atender">
        {header}
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </Section>
    );
  }

  const items: Payment[] = query.items;

  return (
    <Section aria-label="Pagos por atender" aria-busy={query.isPlaceholderData || undefined}>
      {header}
      {counts ? (
        <FilterChips
          label="Filtrar pagos por atender"
          value={category}
          onChange={setCategory}
          options={CHIPS.map(chip => ({ ...chip, count: counts[chip.value] }))}
        />
      ) : null}

      {items.length === 0 ? (
        nothingPending ? (
          <StateMessage
            kind="empty"
            title="Todo al corriente"
            description="No hay pagos por atender en este momento."
          />
        ) : debouncedSearch ? (
          <StateMessage
            kind="empty"
            title={`No encontramos “${debouncedSearch}”`}
            description={`Buscamos solo en ${chipName(category)}. Prueba con otra palabra o limpia la búsqueda.`}
            action={
              <Button variant="secondary" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </Button>
            }
          />
        ) : (
          <StateMessage
            kind="empty"
            title="Todo al corriente"
            description={`No hay pagos por atender en ${chipName(category)}.`}
          />
        )
      ) : isWide ? (
        <Table role="table" aria-label="Pagos por atender">
          <PaymentTableHeader />
          {items.map(payment => (
            <PaymentRow key={payment.id} payment={payment} today={today} />
          ))}
        </Table>
      ) : (
        <Cards>
          {items.map(payment => (
            <PaymentCard key={payment.id} payment={payment} today={today} />
          ))}
        </Cards>
      )}

      {items.length > 0 ? (
        <ListFooter
          query={query}
          endLabel="No hay más cobros"
          errorLabel="No pudimos cargar más cobros"
          skeletonHeight={isWide ? '64px' : '120px'}
        />
      ) : null}
    </Section>
  );
}
