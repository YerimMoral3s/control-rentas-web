import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Property } from '@api/properties';
import type { Unit } from '@api/units';
import { Button, ButtonLink, Notice, StatusBadge } from '@components';
import { useCompletePropertyConfiguration } from '@hooks/querys/properties';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { contractTypeShort } from '@features/contracts/contractText';
import { unitTypeLabel } from '@features/properties/propertyText';
import { formatDateRange } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { useCurrentRents } from '../currentRents';
import { useRentedDrafts } from '@stores';
import { media } from '@styles/theme';
import { setupFailure, type SetupFailure } from '../setupFailure';
import { useSetupNavigation } from '../setupNavigation';
import {
  isSingleType,
  joinNames,
  propertyTypeOption,
  setupPending,
  setupSubtitle,
  UNIT_SETUP_LABEL,
  unitSetupState,
} from '../setupText';
import { SetupLayout } from './SetupLayout';
import { Rows, RowText, StepFooter, StepIntro, StepPanel } from './stepStyles';

const Columns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  ${media.wide} {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
    gap: 24px;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  h3 {
    margin: 0;
    font-size: 16px;
  }

  p {
    margin: 0;
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral700};
  }
`;

const Facts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 16px;
  font-size: 15px;

  dt {
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
`;

const UnitRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;

  > span:last-child {
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral700};
  }
`;

const RentItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  strong {
    font-size: 15px;
  }

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const PendingItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  strong {
    font-size: 15px;
  }

  span {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

type ReviewStepProps = { property: Property; units: Unit[]; onRefresh: () => void };

/** Paso 4 (P-11): la revisión es la confirmación; con pendientes la acción lleva a resolverlos. */
export function ReviewStep({ property, units, onRefresh }: ReviewStepProps) {
  const navigate = useNavigate();
  const nav = useSetupNavigation();
  const events = useInvalidateEvents();
  const complete = useCompletePropertyConfiguration();
  const rentedIds = useRentedDrafts(state => state.unitIds);
  const [failure, setFailure] = useState<SetupFailure | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const pending = setupPending(units, rentedIds);
  const rents = useCurrentRents(property.id);
  const rented = units.flatMap(unit => {
    const contract = rents.get(unit.id);
    return contract ? [{ unit, contract }] : [];
  });
  const hasPending = pending.unreviewed.length > 0 || pending.missingRent.length > 0;
  const states = units.map(unit => unitSetupState(unit, rentedIds));
  const count = (wanted: (typeof states)[number][]) =>
    states.filter(state => wanted.includes(state)).length;
  const summary = [
    count(['rented', 'occupied']) > 0
      ? plural(count(['rented', 'occupied']), 'Rentada', 'Rentadas')
      : '',
    count(['available']) > 0 ? plural(count(['available']), 'Disponible', 'Disponibles') : '',
    count(['maintenance']) > 0 ? `${count(['maintenance'])} En mantenimiento` : '',
    count(['pending']) > 0 ? `${count(['pending'])} por revisar` : '',
  ].filter(Boolean);
  const summaryText =
    summary.length > 1
      ? `${summary.slice(0, -1).join(', ')} y ${summary[summary.length - 1]}.`
      : summary[0]
        ? `${summary[0]}.`
        : '';
  const option = propertyTypeOption(property.property_type);
  // Casa o bodega: el nombre de su unidad ya dice el tipo.
  const single = isSingleType(property.property_type);
  const go = (step: 'tipo' | 'unidades' | 'estados') => nav.goToStep(property.id, step);

  const submit = async () => {
    setFailure(null);
    try {
      await complete.mutateAsync(property.id);
      await events.propertyCompleted(property.id);
      nav.goToStep(property.id, 'listo', true);
    } catch (error) {
      if (isAppError(error) && error.code === 'PROPERTY_CONFIGURATION_ALREADY_COMPLETED') {
        // Pudo completarse en otra pestaña: se consulta su estado actual.
        setAlreadyDone(true);
        await events.propertyCompleted(property.id);
        return;
      }
      setFailure(setupFailure(error, 'No completamos la configuración.'));
      if (isAppError(error) && error.type !== 'uncertain') onRefresh();
    }
  };

  return (
    <SetupLayout
      property={property}
      step="revisar"
      done={{ tipo: true, unidades: true, estados: !hasPending }}
      stepTo={step => nav.stepPath(property.id, step)}
      title={property.name}
      subtitle={setupSubtitle(property, option.title)}
      back={{ label: 'Atrás', onClick: () => go('estados') }}
      onSaveExit={nav.exit}
      saving={complete.isPending}
    >
      <StepPanel>
        <StepIntro>
          <h2>Revisa tu configuración</h2>
          <p>Al completarla, {property.name} aparecerá en Inicio.</p>
        </StepIntro>
        {alreadyDone ? (
          <Notice
            tone="info"
            title="Esta configuración ya estaba completa"
            action={
              <Button
                variant="secondary"
                onClick={() => void navigate(`/propiedades/${property.id}`)}
              >
                Ver propiedad
              </Button>
            }
          >
            No hicimos cambios nuevos.
          </Notice>
        ) : null}
        {failure ? (
          <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
            {failure.body}
          </Notice>
        ) : null}
        <Columns>
          <Stack>
            <Block>
              <header>
                <h3>Propiedad</h3>
                <Button variant="tertiary" onClick={() => go('tipo')}>
                  Cambiar
                </Button>
              </header>
              <Facts>
                <dt>Nombre</dt>
                <dd>{property.name}</dd>
                <dt>Tipo</dt>
                <dd>{option.title}</dd>
                {property.neighborhood ? (
                  <>
                    <dt>Ubicación</dt>
                    <dd>{property.neighborhood}</dd>
                  </>
                ) : null}
                <dt>Código postal</dt>
                <dd>{property.postal_code}</dd>
              </Facts>
            </Block>
            <Block>
              <header>
                <h3>Unidades · {units.length}</h3>
                <Button variant="tertiary" onClick={() => go('unidades')}>
                  Cambiar
                </Button>
              </header>
              {summaryText ? <p>{summaryText}</p> : null}
              <Rows>
                {units.map((unit, index) => (
                  <UnitRow key={unit.id}>
                    <RowText>
                      <strong>{unit.name}</strong>
                      {single ? null : (
                        <small>
                          {unitTypeLabel(unit.unit_type).replace(/^./, c => c.toUpperCase())}
                        </small>
                      )}
                    </RowText>
                    <span>{UNIT_SETUP_LABEL[states[index] ?? 'pending']}</span>
                  </UnitRow>
                ))}
              </Rows>
            </Block>
          </Stack>
          <Stack>
            {rented.length > 0 ? (
              <Block>
                <header>
                  <h3>Rentas actuales · {rented.length}</h3>
                  <Button variant="tertiary" onClick={() => go('estados')}>
                    Cambiar
                  </Button>
                </header>
                {rented.map(({ unit, contract }) => (
                  <RentItem key={contract.id}>
                    <strong>{single ? property.name : unit.name}</strong>
                    <span>
                      {contract.tenant.first_name} {contract.tenant.last_name}{' '}
                      <StatusBadge status={contract.status} compact />
                    </span>
                    <small>
                      {contractTypeShort(contract)} ·{' '}
                      {formatDateRange(contract.start_date, contract.end_date)} ·{' '}
                      {formatMoney(contract.rent_amount)} al mes
                    </small>
                  </RentItem>
                ))}
              </Block>
            ) : null}
            <Block>
              <header>
                <h3>
                  Pendientes
                  {hasPending ? ` · ${pending.unreviewed.length + pending.missingRent.length}` : ''}
                </h3>
              </header>
              {!hasPending ? <p>Todo está revisado.</p> : null}
              {pending.unreviewed.length > 0 ? (
                <PendingItem>
                  <strong>{joinNames(pending.unreviewed.map(unit => unit.name))}</strong>
                  <span>Aún no {pending.unreviewed.length === 1 ? 'tiene' : 'tienen'} estado.</span>
                  <Button variant="secondary" onClick={() => go('estados')}>
                    Revisar unidades
                  </Button>
                </PendingItem>
              ) : null}
              {pending.missingRent.map(unit => (
                <PendingItem key={unit.id}>
                  <strong>{unit.name}</strong>
                  <span>Está Rentada, pero falta su renta actual.</span>
                  <ButtonLink variant="secondary" to={nav.rentPath(property.id, unit.id)}>
                    Cargar renta actual
                  </ButtonLink>
                </PendingItem>
              ))}
            </Block>
          </Stack>
        </Columns>
        <StepFooter>
          {hasPending ? (
            <Button onClick={() => go('estados')}>Revisar pendientes</Button>
          ) : (
            <Button
              onClick={() => void submit()}
              loading={complete.isPending}
              disabled={alreadyDone || failure?.tone === 'uncertain'}
            >
              Completar configuración
            </Button>
          )}
        </StepFooter>
      </StepPanel>
    </SetupLayout>
  );
}
