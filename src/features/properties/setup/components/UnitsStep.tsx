import { useState } from 'react';
import styled from 'styled-components';
import type { Property } from '@api/properties';
import type { Unit, UnitType } from '@api/units';
import { Button, Notice } from '@components';
import { useCreateUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { setupFailure, type SetupFailure } from '../setupFailure';
import { useSetupNavigation } from '../setupNavigation';
import {
  groupTypesFor,
  groupWords,
  propertyTypeOption,
  SINGLE_UNIT,
  setupSubtitle,
  unitGroups,
} from '../setupText';
import { BulkUnitsForm } from './BulkUnitsForm';
import { SetupLayout } from './SetupLayout';
import { RowText, Rows, StepFooter, StepIntro, StepPanel } from './stepStyles';

const GroupRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
`;

const AddButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Single = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid ${({ theme }) => theme.color.neutral200};

  strong {
    font-size: 16px;
  }

  span,
  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const ARTICLE: Record<string, string> = { house: 'Una casa', warehouse: 'Una bodega' };

const GROUPS_INTRO: Record<string, string> = {
  building: 'Un edificio puede tener departamentos o locales. Agrega uno o varios grupos.',
  mixed_use: 'Una propiedad mixta puede tener departamentos y locales. Agrega uno o varios grupos.',
  shopping_plaza: 'Una plaza de locales solo puede tener locales.',
};

type UnitsStepProps = { property: Property; units: Unit[] };

/** Paso 2 (P-07 / P-08): unidad única de casa o bodega, o grupos de departamentos y locales. */
export function UnitsStep({ property, units }: UnitsStepProps) {
  const nav = useSetupNavigation();
  const events = useInvalidateEvents();
  const createUnit = useCreateUnit();
  const allowed = groupTypesFor(property.property_type);
  const single = SINGLE_UNIT[property.property_type];
  const [adding, setAdding] = useState<UnitType | null>(null);
  const [lastType, setLastType] = useState<UnitType>(allowed[0] ?? 'apartment');
  const [missing, setMissing] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const option = propertyTypeOption(property.property_type);

  const frame = {
    step: 'unidades' as const,
    done: { tipo: true, unidades: property.has_units },
    stepTo: (step: Parameters<typeof nav.stepPath>[1]) => nav.stepPath(property.id, step),
    title: property.name,
    subtitle: setupSubtitle(property, option.title),
    back: { label: 'Atrás', onClick: () => nav.goToStep(property.id, 'tipo') },
    onSaveExit: nav.exit,
    property,
  };

  /** Casa o bodega: su unidad se crea al continuar, si aún no existe (una escritura por acción). */
  const continueSingle = async () => {
    if (!single) return;
    setFailure(null);
    if (units.length === 0) {
      try {
        await createUnit.mutateAsync({ property_id: property.id, ...single });
        await events.unitsChanged(property.id);
      } catch (error) {
        setFailure(setupFailure(error, `No creamos la unidad ${single.name}.`));
        return;
      }
    }
    nav.goToStep(property.id, 'estados');
  };

  if (single) {
    const unit = units[0];
    return (
      <SetupLayout {...frame} saving={createUnit.isPending}>
        <StepPanel>
          <StepIntro>
            <h2>Su unidad</h2>
            <p>{ARTICLE[property.property_type]} se renta completa.</p>
          </StepIntro>
          {failure ? (
            <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
              {failure.body}
            </Notice>
          ) : null}
          <Single>
            <strong>{unit?.name ?? single.name}</strong>
            <span>Única unidad de {property.name}</span>
          </Single>
          <small>No necesitas indicar cantidad ni agregar otras unidades.</small>
          <StepFooter>
            <Button
              onClick={() => void continueSingle()}
              loading={createUnit.isPending}
              disabled={failure?.tone === 'uncertain'}
            >
              Continuar con el estado
            </Button>
          </StepFooter>
        </StepPanel>
      </SetupLayout>
    );
  }

  if (adding) {
    return (
      <SetupLayout {...frame} back={{ label: 'Unidades', onClick: () => setAdding(null) }}>
        <StepPanel>
          <BulkUnitsForm
            property={property}
            units={units}
            unitType={lastType}
            onUnitTypeChange={setLastType}
            onClose={() => setAdding(null)}
            onCreated={() => {
              setAdding(null);
              setMissing(false);
            }}
          />
        </StepPanel>
      </SetupLayout>
    );
  }

  const groups = unitGroups(units);
  const open = (type: UnitType) => {
    setLastType(type);
    setAdding(type);
  };

  return (
    <SetupLayout {...frame}>
      <StepPanel>
        <StepIntro>
          <h2>¿Qué {allowed.length === 1 ? 'locales' : 'unidades'} tiene?</h2>
          <p>{GROUPS_INTRO[property.property_type]}</p>
        </StepIntro>
        {missing ? (
          <Notice tone="error" title="Agrega al menos una unidad para continuar." />
        ) : null}
        {groups.length > 0 ? (
          <Rows>
            {groups.map(group => (
              <GroupRow key={group.unit_type}>
                <RowText>
                  <strong>
                    {groupWords(group.unit_type).many.replace(/^./, letter => letter.toUpperCase())}{' '}
                    · {group.count}
                  </strong>
                  <small>{group.range}</small>
                </RowText>
                {/* Cambiar o quitar un grupo: fase 4D. */}
                <Button variant="tertiary" disabled title="Disponible próximamente">
                  Cambiar
                </Button>
              </GroupRow>
            ))}
          </Rows>
        ) : null}
        <AddButtons>
          {allowed.map(type => (
            <Button key={type} variant="secondary" icon="plus" onClick={() => open(type)}>
              Agregar {groupWords(type).many}
            </Button>
          ))}
        </AddButtons>
        <StepFooter>
          <Button
            onClick={() =>
              units.length > 0 ? nav.goToStep(property.id, 'estados') : setMissing(true)
            }
          >
            Continuar con los estados
          </Button>
        </StepFooter>
      </StepPanel>
    </SetupLayout>
  );
}
