import MiniSearch from 'minisearch';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { Unit } from '@api/units';
import { Dialog, SearchField, SectionError, Skeleton } from '@components';
import { propertyTypeOption } from '@features/properties/setup/setupText';
import { useExpenseDestinations } from '@hooks/querys/expenses';
import type { ExpenseDestination } from './destination';

const Groups = styled.div`
  margin-top: 12px;
  max-height: min(60vh, 480px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Group = styled.section`
  h3 {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral600};
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid ${({ theme }) => theme.color.neutral200};
    border-radius: ${({ theme }) => theme.radius.card};
    overflow: hidden;
  }

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const Choice = styled.button<{ $selected: boolean }>`
  width: 100%;
  min-height: 48px;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 0;
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : theme.color.white)};
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  color: ${({ theme }) => theme.color.neutral950};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: -2px;
  }

  small {
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Empty = styled.p`
  margin: 12px 0 0;
  font-size: 15px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const STATUS: Record<Unit['status'], string> = {
  available: 'Disponible',
  occupied: 'Ocupada',
  maintenance: 'En mantenimiento',
  inactive: 'Eliminada',
};

type DestinationPickerProps = {
  open: boolean;
  /** Elegir una unidad o una propiedad completa. */
  mode: ExpenseDestination['kind'];
  selected: ExpenseDestination | null;
  onSelect: (destination: ExpenseDestination) => void;
  onClose: () => void;
};

/**
 * Selector de destino (E-01, E-02, E-04): busca por propiedad o unidad y agrupa por propiedad.
 * Elegir una opción la toma y cierra la hoja.
 */
export function DestinationPicker({
  open,
  mode,
  selected,
  onSelect,
  onClose,
}: DestinationPickerProps) {
  const catalog = useExpenseDestinations();
  const [term, setTerm] = useState('');
  const data = catalog.data?.data;

  // Propiedades por nombre y unidades en orden natural dentro de cada una.
  const groups = useMemo(() => {
    if (!data) return [];
    return [...data.properties]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map(property => ({
        property,
        units: data.units
          .filter(unit => unit.property.id === property.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })),
      }));
  }, [data]);

  const index = useMemo(() => {
    const search = new MiniSearch<{ id: string; name: string; property: string }>({
      fields: ['name', 'property'],
      storeFields: ['id'],
      searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND' },
    });
    if (data) {
      search.addAll(
        data.properties.map(item => ({ id: `p:${item.id}`, name: item.name, property: item.name })),
      );
      search.addAll(
        data.units.map(unit => ({
          id: `u:${unit.id}`,
          name: unit.name,
          property: unit.property.name,
        })),
      );
    }
    return search;
  }, [data]);

  const found = useMemo(
    () =>
      term.trim() ? new Set(index.search(term.trim()).map(result => String(result.id))) : null,
    [index, term],
  );

  const visible = groups
    .map(group => ({
      ...group,
      units: group.units.filter(
        unit => !found || found.has(`u:${unit.id}`) || found.has(`p:${group.property.id}`),
      ),
      propertyMatch: !found || found.has(`p:${group.property.id}`),
    }))
    .filter(group => (mode === 'unit' ? group.units.length > 0 : group.propertyMatch));

  const choose = (destination: ExpenseDestination) => {
    setTerm('');
    onSelect(destination);
  };

  const selectedId =
    selected?.kind === 'property'
      ? `p:${selected.property.id}`
      : selected
        ? `u:${selected.unit.id}`
        : null;

  return (
    <Dialog
      open={open}
      title={mode === 'unit' ? 'Elige la unidad' : 'Elige la propiedad'}
      onClose={onClose}
    >
      <SearchField
        value={term}
        onChange={setTerm}
        label="Buscar por propiedad o unidad"
        placeholder="Buscar por propiedad o unidad"
      />
      {catalog.isPending ? (
        <Skeleton $height="200px" />
      ) : catalog.isError ? (
        <SectionError onRetry={() => void catalog.refetch()} retrying={catalog.isFetching} />
      ) : visible.length === 0 ? (
        <Empty>
          {term.trim()
            ? mode === 'unit'
              ? 'No encontramos unidades con ese nombre.'
              : 'No encontramos propiedades con ese nombre.'
            : 'Todavía no tienes propiedades.'}
        </Empty>
      ) : (
        <Groups>
          {visible.map(({ property, units }) => (
            <Group key={property.id} aria-label={property.name}>
              <h3>
                {property.name} · {propertyTypeOption(property.property_type).title}
              </h3>
              <ul>
                {mode === 'unit' ? (
                  units.map(unit => (
                    <li key={unit.id}>
                      <Choice
                        type="button"
                        $selected={selectedId === `u:${unit.id}`}
                        aria-pressed={selectedId === `u:${unit.id}`}
                        onClick={() => choose({ kind: 'unit', unit })}
                      >
                        {unit.name}
                        <small>{STATUS[unit.status]}</small>
                      </Choice>
                    </li>
                  ))
                ) : (
                  <li>
                    <Choice
                      type="button"
                      $selected={selectedId === `p:${property.id}`}
                      aria-pressed={selectedId === `p:${property.id}`}
                      onClick={() => choose({ kind: 'property', property })}
                    >
                      Toda la propiedad
                      <small>Gastos generales</small>
                    </Choice>
                  </li>
                )}
              </ul>
            </Group>
          ))}
        </Groups>
      )}
    </Dialog>
  );
}
