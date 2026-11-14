import { useState } from 'react';
import styled from 'styled-components';
import type { Property } from '@api/properties';
import type { Unit } from '@api/units';
import { Button, Dialog, DialogActions, Notice, OptionGroup } from '@components';
import { useReviewUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { unitTypeLabel } from '@features/properties/propertyText';
import { useMediaQuery } from '@lib/useMediaQuery';
import { useRentedDrafts } from '@stores';
import { media, theme as tokens } from '@styles/theme';
import { setupFailure, type SetupFailure } from '../setupFailure';
import { useSetupNavigation } from '../setupNavigation';
import {
  isSingleType,
  pendingSentence,
  propertyTypeOption,
  setupPending,
  setupSubtitle,
  UNIT_SETUP_LABEL,
  unitSetupState,
  type UnitSetupState,
} from '../setupText';
import { SetupLayout } from './SetupLayout';
import { Rows, RowText, StepFooter, StepIntro, StepPanel } from './stepStyles';

type Choice = 'available' | 'maintenance' | 'rented';

const CHOICES: ReadonlyArray<{ value: Choice; label: string; help: string }> = [
  { value: 'available', label: 'Disponible', help: 'Lista para rentarse.' },
  { value: 'maintenance', label: 'En mantenimiento', help: 'No se puede rentar por ahora.' },
  {
    value: 'rented',
    label: 'Rentada',
    help: 'Alguien la renta hoy. Después cargarás su renta actual.',
  },
];

const Row = styled.li`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 0;

  ${media.wide} {
    display: grid;
    grid-template-columns: minmax(140px, 1fr) minmax(0, 2fr);
    align-items: center;
    gap: 16px;
  }
`;

const RowHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const Tag = styled.span<{ $state: UnitSetupState }>`
  flex: none;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 13px;
  font-weight: 700;
  transition: background-color 140ms;
  background: ${({ $state, theme }) =>
    $state === 'pending'
      ? theme.color.warningBg
      : $state === 'maintenance'
        ? theme.color.mutedBg
        : theme.color.primary100};
  color: ${({ $state, theme }) =>
    $state === 'pending'
      ? theme.color.warning
      : $state === 'maintenance'
        ? theme.color.muted
        : theme.color.primary700};

  ${media.reducedMotion} {
    transition: none;
  }
`;

const Extra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  p {
    margin: 0;
    font-size: 13px;
    color: ${({ theme }) => theme.color.warning};
    font-weight: 700;
  }
`;

const SheetOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SheetOption = styled.label<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral300)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none'};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : theme.color.white)};
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  strong {
    font-size: 16px;
  }

  span {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const choiceOf = (state: UnitSetupState): Choice | undefined =>
  state === 'pending' ? undefined : state === 'occupied' ? 'rented' : state;

type StatesStepProps = { property: Property; units: Unit[] };

/**
 * Paso 3 (P-09): estado de hoy de cada unidad. Disponible y En mantenimiento se guardan al
 * elegirlos; Rentada queda marcada aquí hasta cargar su renta actual (P-10, fase 4C).
 */
export function StatesStep({ property, units }: StatesStepProps) {
  // Los tres botones en línea necesitan ancho: desde 1200 px; antes, la hoja de estado.
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.wide})`);
  const nav = useSetupNavigation();
  const events = useInvalidateEvents();
  const review = useReviewUnit();
  const rentedIds = useRentedDrafts(state => state.unitIds);
  const markRented = useRentedDrafts(state => state.mark);
  const unmarkRented = useRentedDrafts(state => state.unmark);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ unitId: string; detail: SetupFailure } | null>(null);
  const [sheet, setSheet] = useState<{ unit: Unit; choice: Choice | undefined } | null>(null);
  const pending = setupPending(units, rentedIds);
  // Casa o bodega: el nombre de su unidad ya dice el tipo.
  const single = isSingleType(property.property_type);
  const sentence = pendingSentence(pending);

  const choose = async (unit: Unit, choice: Choice) => {
    setFailure(null);
    if (choice === 'rented') {
      markRented(unit.id);
      return;
    }
    // Ya revisada con ese estado: solo se quita la marca de Rentada, sin otra escritura.
    if (unit.reviewed_at && unit.status === choice) {
      unmarkRented(unit.id);
      return;
    }
    setSavingId(unit.id);
    try {
      await review.mutateAsync({ unitId: unit.id, status: choice });
      unmarkRented(unit.id);
      await events.unitsChanged(property.id);
    } catch (error) {
      setFailure({
        unitId: unit.id,
        detail: setupFailure(error, `No guardamos el estado de ${unit.name}.`),
      });
    } finally {
      setSavingId(null);
    }
  };

  const goReview = () => nav.goToStep(property.id, 'revisar');

  return (
    <SetupLayout
      property={property}
      step="estados"
      done={{
        tipo: true,
        unidades: true,
        estados: pending.unreviewed.length === 0 && pending.missingRent.length === 0,
      }}
      stepTo={step => nav.stepPath(property.id, step)}
      title={property.name}
      subtitle={setupSubtitle(property, propertyTypeOption(property.property_type).title)}
      back={{ label: 'Atrás', onClick: () => nav.goToStep(property.id, 'unidades') }}
      onSaveExit={nav.exit}
    >
      <StepPanel>
        <StepIntro>
          <h2>Revisa tus unidades</h2>
          <p>Elige cómo está cada una hoy.{sentence ? ` ${sentence}` : ''}</p>
        </StepIntro>
        <Rows>
          {units.map(unit => {
            const state = unitSetupState(unit, rentedIds);
            const saving = savingId === unit.id;
            return (
              <Row key={unit.id} aria-busy={saving || undefined}>
                <RowHead>
                  <RowText>
                    <strong>{unit.name}</strong>
                    {single ? null : (
                      <small>
                        {unitTypeLabel(unit.unit_type).replace(/^./, c => c.toUpperCase())}
                      </small>
                    )}
                  </RowText>
                  {!isDesktop || state === 'pending' || state === 'occupied' ? (
                    <Tag $state={state}>{UNIT_SETUP_LABEL[state]}</Tag>
                  ) : null}
                </RowHead>
                <div>
                  {state === 'occupied' ? (
                    <small>Ya tiene su renta actual.</small>
                  ) : isDesktop ? (
                    <OptionGroup
                      label={`Estado de ${unit.name}`}
                      hideLabel
                      value={choiceOf(state)}
                      options={CHOICES.map(({ value, label }) => ({ value, label }))}
                      onChange={choice => void choose(unit, choice)}
                    />
                  ) : null}
                  <Extra>
                    {state === 'rented' ? <p>Falta: cargar su renta actual</p> : null}
                    {state === 'rented' ? (
                      // P-10 llega en la fase 4C.
                      <Button variant="secondary" disabled title="Disponible próximamente">
                        Cargar renta actual
                      </Button>
                    ) : null}
                    {!isDesktop && state !== 'occupied' ? (
                      <Button
                        variant="tertiary"
                        loading={saving}
                        onClick={() => setSheet({ unit, choice: choiceOf(state) })}
                      >
                        {state === 'pending' ? 'Elegir estado' : 'Cambiar estado'}
                      </Button>
                    ) : null}
                  </Extra>
                  {failure?.unitId === unit.id ? (
                    <Notice
                      tone={failure.detail.tone}
                      title={failure.detail.title}
                      requestId={failure.detail.requestId}
                    >
                      {failure.detail.body}
                    </Notice>
                  ) : null}
                </div>
              </Row>
            );
          })}
        </Rows>
        <StepFooter>
          <Button onClick={goReview}>Revisar configuración</Button>
        </StepFooter>
      </StepPanel>
      <Dialog
        open={sheet !== null}
        title={sheet ? `¿Cómo está ${sheet.unit.name} hoy?` : ''}
        onClose={() => setSheet(null)}
        busy={savingId !== null}
      >
        <SheetOptions role="radiogroup" aria-label="Estado de hoy">
          {CHOICES.map(option => (
            <SheetOption key={option.value} $selected={sheet?.choice === option.value}>
              <input
                type="radio"
                className="visually-hidden"
                name="unit-state"
                checked={sheet?.choice === option.value}
                onChange={() =>
                  setSheet(current => (current ? { ...current, choice: option.value } : current))
                }
              />
              <strong>{option.label}</strong>
              <span>{option.help}</span>
            </SheetOption>
          ))}
        </SheetOptions>
        <DialogActions>
          <Button
            disabled={!sheet?.choice}
            loading={savingId !== null}
            onClick={() => {
              if (!sheet?.choice) return;
              const { unit, choice } = sheet;
              // Si falla, la hoja se cierra y el aviso queda junto a la unidad.
              void choose(unit, choice).then(() => setSheet(null));
            }}
          >
            Guardar estado
          </Button>
          <Button variant="secondary" onClick={() => setSheet(null)} disabled={savingId !== null}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </SetupLayout>
  );
}
