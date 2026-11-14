import { useSearchParams } from 'react-router';
import styled from 'styled-components';
import { useDebounce } from 'use-debounce';
import type { ExpenseType } from '@api/expenses';
import type { MovementKind } from '@api/movements';
import type { PaymentType } from '@api/payments';
import {
  Button,
  FilterChips,
  ListFooter,
  SearchField,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useMovements } from '@hooks/querys/movements';
import { useAttentionPayments } from '@hooks/querys/payments';
import { monthRange } from '@lib/dates';
import { EXPENSE_TYPES, movementTypeName, PAYMENT_TYPES } from '@lib/labels';
import { useMediaQuery } from '@lib/useMediaQuery';
import { media, theme as tokens } from '@styles/theme';
import { HeaderRow, MovementList } from './components/MovementList';

const SEARCH_DEBOUNCE_MS = 350;

type Chip = 'all' | MovementKind;
type MovementType = PaymentType | ExpenseType;

const CHIPS: ReadonlyArray<{ value: Chip; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Entradas' },
  { value: 'expense', label: 'Gastos' },
];

const ALL_TYPES: readonly MovementType[] = [...PAYMENT_TYPES, ...EXPENSE_TYPES];

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.desktop} {
    gap: 20px;
  }
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 34px;
  }

  p {
    margin: 2px 0 0;
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Search = styled.div`
  ${media.desktop} {
    width: 420px;
  }
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Select = styled.select`
  min-height: ${({ theme }) => theme.size.touch};
  padding: 0 36px 0 14px;
  border: 1px solid ${({ theme }) => theme.color.neutral300};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.white}
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23475467' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  appearance: none;
  font: inherit;
  font-size: 15px;
  color: ${({ theme }) => theme.color.neutral950};
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }
`;

const isChip = (value: string | null): value is Chip => CHIPS.some(chip => chip.value === value);
const isType = (value: string | null): value is MovementType =>
  value !== null && (ALL_TYPES as readonly string[]).includes(value);

/** M-01 a M-04: libreta del dinero que ya entró o salió. Filtros en la URL para volver al mismo punto. */
export function MovementsPage() {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  // Fecha operativa del servidor (misma consulta en caché que Inicio) para "Hoy" y los meses.
  const today = useAttentionPayments('all', '').meta?.as_of_date;
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const rawKind = params.get('tipo');
  const kind: Chip = isChip(rawKind) ? rawKind : 'all';
  const rawType = params.get('categoria');
  const type = isType(rawType) ? rawType : null;
  const month = params.get('mes');

  const update = (
    next: Partial<{ q: string; tipo: Chip; categoria: MovementType | null; mes: string | null }>,
  ) => {
    const values = { q: search, tipo: kind, categoria: type, mes: month, ...next };
    setParams(
      {
        ...(values.q ? { q: values.q } : {}),
        ...(values.tipo !== 'all' ? { tipo: values.tipo } : {}),
        ...(values.categoria ? { categoria: values.categoria } : {}),
        ...(values.mes ? { mes: values.mes } : {}),
      },
      { replace: true, preventScrollReset: true },
    );
  };

  const [debouncedSearch] = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const range = month ? monthRange(month) : null;
  const query = useMovements({
    ...(kind !== 'all' ? { kind } : {}),
    ...(type ? { type } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(range ? { date_from: range.from, date_to: range.to } : {}),
  });
  const counts = query.meta?.counts;
  const filtered = Boolean(debouncedSearch || type || month || kind !== 'all');

  const months = today ? [monthRange(today.slice(0, 7)), monthRange(today.slice(0, 7), -1)] : [];
  const typeOptions =
    kind === 'income' ? PAYMENT_TYPES : kind === 'expense' ? EXPENSE_TYPES : ALL_TYPES;

  // Registrar gasto llega con su formulario (fase 7): deshabilitado, sin simular.
  const registerExpense = (label: string) => (
    <Button icon="plus" disabled title="Disponible próximamente">
      {label}
    </Button>
  );

  const header = (
    <Head>
      <div>
        <h1>Movimientos</h1>
        <p>Dinero que ya entró o salió.</p>
      </div>
      {registerExpense('Registrar gasto')}
    </Head>
  );

  // M-04 primera vez: sin buscador ni chips porque no hay nada que filtrar.
  if (!filtered && counts?.all === 0) {
    return (
      <Page>
        {header}
        <StateMessage
          kind="empty"
          title="Aún no hay movimientos registrados"
          description="Aquí verás los pagos que registres y tus gastos."
          action={registerExpense('Registrar primer gasto')}
        />
      </Page>
    );
  }

  let content;
  if (query.isPending) {
    content = (
      <div aria-busy="true" aria-label="Cargando movimientos">
        <Skeleton $height="280px" $radius={tokens.radius.card} />
      </div>
    );
  } else if (query.isError && !query.data) {
    content = <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  } else if (query.items.length === 0) {
    content = (
      <StateMessage
        kind="empty"
        title={
          debouncedSearch
            ? `No encontramos movimientos con “${debouncedSearch}”`
            : 'No hay movimientos con estos filtros'
        }
        description="Revisa la búsqueda o cambia los filtros."
        action={
          <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
            Limpiar búsqueda y filtros
          </Button>
        }
      />
    );
  } else {
    content = (
      <div aria-busy={query.isPlaceholderData || undefined}>
        {isDesktop ? (
          <HeaderRow aria-hidden="true">
            <span>Fecha</span>
            <span>Concepto</span>
            <span>Relacionado con</span>
            <span>Tipo</span>
            <span style={{ textAlign: 'right' }}>Importe</span>
          </HeaderRow>
        ) : null}
        <MovementList movements={query.items} today={today} desktop={isDesktop} />
        <ListFooter
          query={query}
          endLabel="No hay más movimientos"
          errorLabel="No pudimos cargar más movimientos"
        />
      </div>
    );
  }

  return (
    <Page>
      {header}
      <Search>
        <SearchField
          value={search}
          onChange={value => update({ q: value })}
          label="Buscar movimiento por concepto, persona o inmueble"
          placeholder="Buscar concepto, persona o inmueble"
        />
      </Search>
      <FilterChips
        label="Filtrar movimientos"
        value={kind}
        onChange={value =>
          // Si la categoría elegida no pertenece al nuevo chip, se quita para no dejar la lista vacía.
          update({
            tipo: value,
            categoria:
              type &&
              value !== 'all' &&
              !(value === 'income' ? PAYMENT_TYPES : EXPENSE_TYPES).includes(type as never)
                ? null
                : type,
          })
        }
        options={CHIPS.map(chip => ({ ...chip, count: counts?.[chip.value] }))}
      />
      <Filters>
        <Select
          aria-label="Filtrar por fecha"
          value={month ?? ''}
          onChange={event => update({ mes: event.target.value || null })}
        >
          <option value="">Todas las fechas</option>
          {months.map(option => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
          {month && !months.some(option => option.key === month) ? (
            <option value={month}>{monthRange(month).label}</option>
          ) : null}
        </Select>
        <Select
          aria-label="Filtrar por tipo"
          value={type ?? ''}
          onChange={event =>
            update({ categoria: isType(event.target.value) ? event.target.value : null })
          }
        >
          <option value="">Todos los tipos</option>
          {typeOptions.map(option => (
            <option key={option} value={option}>
              {movementTypeName(option)}
            </option>
          ))}
        </Select>
      </Filters>
      {content}
    </Page>
  );
}
