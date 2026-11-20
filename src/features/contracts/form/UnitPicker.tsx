import MiniSearch from 'minisearch';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { UnitSummary } from '@api/units';
import { Button, Icon, Notice, SearchField, SectionError, Skeleton } from '@components';
import { StepIntro, StickyStepFooter } from '@features/properties/setup/components/stepStyles';
import { useAvailableUnitsCatalog } from '@hooks/querys/units';
import { media } from '@styles/theme';

const Results = styled.ul`
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${media.desktop} {
    max-height: 360px;
    overflow-y: auto;
  }
`;

const Option = styled.label<{ $selected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral200)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none'};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : theme.color.white)};
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    font-size: 16px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  svg {
    flex: none;
    color: ${({ theme }) => theme.color.primary600};
  }
`;

const Note = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const buildIndex = (units: UnitSummary[]) => {
  const index = new MiniSearch<{ id: string; unit: string; property: string }>({
    fields: ['unit', 'property'],
    storeFields: ['id'],
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND' },
  });
  index.addAll(units.map(unit => ({ id: unit.id, unit: unit.name, property: unit.property.name })));
  return index;
};

/** Casa o bodega: solo la propiedad; el resto, unidad y propiedad debajo. */
const unitTexts = (unit: UnitSummary) =>
  unit.property.property_type === 'house' || unit.property.property_type === 'warehouse'
    ? { title: unit.property.name, sub: 'Disponible' }
    : { title: unit.name, sub: `${unit.property.name} · Disponible` };

type UnitPickerProps = {
  tenantName: string;
  selected: UnitSummary | null;
  onSelect: (unit: UnitSummary) => void;
  onContinue: () => void;
};

/**
 * C-07 desde un inquilino: busca entre las unidades Disponibles de propiedades terminadas, por
 * unidad o propiedad (MiniSearch). Las Ocupadas, En mantenimiento o sin terminar no aparecen.
 */
export function UnitPicker({ tenantName, selected, onSelect, onContinue }: UnitPickerProps) {
  const catalog = useAvailableUnitsCatalog();
  const [term, setTerm] = useState('');
  const [missing, setMissing] = useState(false);
  // Por propiedad y unidad, en orden natural ("Departamento 9" antes de "Departamento 10").
  const units = useMemo(
    () =>
      [...(catalog.data?.data ?? [])].sort(
        (a, b) =>
          a.property.name.localeCompare(b.property.name, 'es') ||
          a.name.localeCompare(b.name, 'es', { numeric: true }),
      ),
    [catalog.data],
  );
  const index = useMemo(() => buildIndex(units), [units]);
  const results = useMemo(() => {
    if (!term.trim()) return units;
    const found = new Set(index.search(term.trim()).map(result => String(result.id)));
    return units.filter(unit => found.has(unit.id));
  }, [index, term, units]);

  return (
    <>
      <StepIntro>
        <h2>¿Qué unidad va a rentar {tenantName}?</h2>
      </StepIntro>
      {missing ? <Notice tone="error" title="Elige la unidad que va a rentar." /> : null}
      <SearchField
        value={term}
        onChange={setTerm}
        label="Busca la unidad"
        placeholder="Por propiedad o unidad"
      />
      {catalog.isPending ? (
        <Skeleton $height="160px" />
      ) : catalog.isError ? (
        <SectionError onRetry={() => void catalog.refetch()} retrying={catalog.isFetching} />
      ) : results.length === 0 ? (
        <Note>
          {term.trim()
            ? `No encontramos una unidad Disponible con “${term.trim()}”.`
            : 'No tienes unidades Disponibles. Una unidad Ocupada o En mantenimiento no puede recibir un contrato.'}
        </Note>
      ) : (
        <Results role="radiogroup" aria-label="Unidades disponibles">
          {results.map(unit => {
            const texts = unitTexts(unit);
            const isSelected = unit.id === selected?.id;
            return (
              <li key={unit.id}>
                <Option $selected={isSelected}>
                  <input
                    type="radio"
                    className="visually-hidden"
                    name="unit"
                    checked={isSelected}
                    onChange={() => {
                      setMissing(false);
                      onSelect(unit);
                    }}
                  />
                  <span>
                    <strong>{texts.title}</strong>
                    <small>{texts.sub}</small>
                  </span>
                  {isSelected ? <Icon name="check" size={20} strokeWidth={2.6} /> : null}
                </Option>
              </li>
            );
          })}
        </Results>
      )}
      <Note>Solo aparecen unidades Disponibles; las propiedades sin terminar o eliminadas no.</Note>
      <StickyStepFooter>
        <Button onClick={() => (selected ? onContinue() : setMissing(true))}>
          Continuar con las condiciones
        </Button>
      </StickyStepFooter>
    </>
  );
}

/** "Departamento 103, Residencial Alameda"; casa o bodega, solo la propiedad. */
export const unitLabel = (unit: Pick<UnitSummary, 'name' | 'property'>) =>
  unit.property.property_type === 'house' || unit.property.property_type === 'warehouse'
    ? unit.property.name
    : `${unit.name}, ${unit.property.name}`;
