import { useState } from 'react';
import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import type { Dashboard } from '@api/dashboard';
import {
  Button,
  Dialog,
  DialogActions,
  Icon,
  ListFooter,
  Skeleton,
  StatusBadge,
} from '@components';
import { useExpiringContracts } from '@hooks/querys/contracts';
import { useDashboardUnits } from '@hooks/querys/units';
import { formatShortDate } from '@lib/dates';
import { placeName } from '@lib/place';
import { useMediaQuery } from '@lib/useMediaQuery';
import { media, theme as tokens } from '@styles/theme';
import { SectionError } from './SectionError';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Cuántos contratos se ven en la sección de computadora antes de "Ver los N". */
const SECTION_PREVIEW = 5;

type SheetKind = 'contracts' | 'maintenance' | 'available';

const SHEETS: Record<SheetKind, { title: string; description: string }> = {
  contracts: {
    title: 'Contratos por vencer',
    description: 'Contratos activos que terminan en los próximos 30 días.',
  },
  maintenance: {
    title: 'Unidades en mantenimiento',
    description: 'No se pueden rentar hasta marcarlas como disponibles.',
  },
  available: {
    title: 'Unidades disponibles',
    description: 'Unidades revisadas y listas para rentar.',
  },
};

const AlertList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const alertTone = {
  warning: css`
    color: ${({ theme }) => theme.color.warning};
    background: ${({ theme }) => theme.color.warningBg};
    border-color: ${({ theme }) => theme.color.warningBorder};
  `,
  success: css`
    color: ${({ theme }) => theme.color.success};
    background: ${({ theme }) => theme.color.successBg};
    border-color: ${({ theme }) => theme.color.successBorder};
  `,
};

const alertStyle = css<{ $tone: keyof typeof alertTone }>`
  min-height: ${({ theme }) => theme.size.touch};
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radius.pill};
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  ${({ $tone }) => alertTone[$tone]}
`;

const AlertButton = styled.button<{ $tone: keyof typeof alertTone }>`
  ${alertStyle}
`;

/* ---------- Computadora: secciones con filas ---------- */

const Sections = styled.div<{ $both: boolean }>`
  display: grid;
  gap: 16px;
  grid-template-columns: ${({ $both }) => ($both ? '3fr 2fr' : '1fr')};
  align-items: start;
`;

const Panel = styled.section`
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
  overflow: hidden;
`;

const PanelTitle = styled.h2`
  margin: 0;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};

  span {
    font-weight: 600;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const ItemLink = styled(Link)`
  min-height: 56px;
  padding: 8px 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 2px 12px;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  strong {
    font-size: 15px;
    line-height: 22px;
  }
`;

const ItemSub = styled.span`
  grid-column: 1;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const ItemSide = styled.span<{ $warning?: boolean }>`
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: ${({ $warning, theme }) => ($warning ? theme.color.warning : theme.color.neutral600)};
  white-space: nowrap;
`;

const UnitRow = styled.li`
  min-height: 56px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 15px;
`;

const rowActionStyle = css`
  margin-left: auto;
  min-height: ${({ theme }) => theme.size.touch};
  padding: 0 10px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.control};
  background: transparent;
  color: ${({ theme }) => theme.color.primary600};
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.primary50};
  }
`;

const RowAction = styled.button`
  ${rowActionStyle}
`;

const RowActionLink = styled(Link)`
  ${rowActionStyle}
  display: inline-flex;
  align-items: center;
  text-decoration: none;
`;

const PanelFoot = styled.div`
  padding: 4px 10px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};
`;

const DialogText = styled.p`
  margin: -4px 0 12px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const DialogList = styled.div`
  margin: 0 -16px 16px;

  ${media.desktop} {
    margin: 0 -24px 16px;
  }
`;

/* ---------- Listas (sección y hoja comparten la consulta) ---------- */

function LoadingRows() {
  return (
    <Rows aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <UnitRow key={index}>
          <Skeleton $height="18px" $width="60%" />
        </UnitRow>
      ))}
    </Rows>
  );
}

/** Contratos por vencer. Cada fila abre su contrato. `limit` recorta la vista previa de la sección. */
function ContractItems({ limit }: { limit?: number }) {
  const query = useExpiringContracts(true);
  if (query.isPending) return <LoadingRows />;
  if (query.isError && !query.data) {
    return <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  const items = limit ? query.items.slice(0, limit) : query.items;
  return (
    <>
      <Rows>
        {items.map(contract => (
          <li key={contract.id}>
            <ItemLink to={`/contratos/${contract.id}`}>
              <strong>
                {contract.tenant.first_name} {contract.tenant.last_name}
              </strong>
              <ItemSub>{placeName(contract.unit.name, contract.property)}</ItemSub>
              <ItemSide $warning>Termina el {formatShortDate(contract.end_date)}</ItemSide>
            </ItemLink>
          </li>
        ))}
      </Rows>
      {limit ? null : (
        <ListFooter
          query={query}
          endLabel="No hay más contratos por vencer"
          errorLabel="No pudimos cargar más contratos"
          skeletonHeight="56px"
        />
      )}
    </>
  );
}

/** Unidades en mantenimiento o disponibles. Cada fila abre el detalle de la unidad. */
function UnitItems({ status }: { status: 'available' | 'maintenance' }) {
  const query = useDashboardUnits(status, true);
  if (query.isPending) return <LoadingRows />;
  if (query.isError && !query.data) {
    return <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  return (
    <>
      <Rows>
        {query.items.map(unit => (
          <li key={unit.id}>
            <ItemLink to={`/unidades/${unit.id}`}>
              <strong>{unit.name}</strong>
              <ItemSub>{unit.property.name}</ItemSub>
              <ItemSide>
                <Icon name="chevronRight" size={18} strokeWidth={2.4} />
              </ItemSide>
            </ItemLink>
          </li>
        ))}
      </Rows>
      <ListFooter
        query={query}
        endLabel={
          status === 'maintenance'
            ? 'No hay más unidades en mantenimiento'
            : 'No hay más unidades disponibles'
        }
        errorLabel="No pudimos cargar más unidades"
        skeletonHeight="56px"
      />
    </>
  );
}

/** Hoja (celular) o diálogo (computadora) con la lista completa de un aviso. */
function AlertSheet({ kind, onClose }: { kind: SheetKind | null; onClose: () => void }) {
  const sheet = kind ? SHEETS[kind] : SHEETS.contracts;
  return (
    <Dialog open={kind !== null} title={sheet.title} onClose={onClose}>
      <DialogText>{sheet.description}</DialogText>
      {kind ? (
        <DialogList>
          {kind === 'contracts' ? <ContractItems /> : <UnitItems status={kind} />}
        </DialogList>
      ) : null}
      <DialogActions>
        <Button variant="neutral" fullWidth onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Con una sola unidad en ese estado, se nombra y se abre directo; con varias, se abre su lista. */
function SingleUnitLink({ status }: { status: 'available' | 'maintenance' }) {
  const query = useDashboardUnits(status, true);
  const unit = query.items[0];
  if (!unit) return null;
  return (
    <>
      <span>
        {unit.property.name} / {unit.name}
      </span>
      <RowActionLink to={`/unidades/${unit.id}`}>Ver unidad</RowActionLink>
    </>
  );
}

type RentalAlertsProps = {
  alerts: Dashboard['rental_summary'];
};

/** H-04 / H-05: contratos por vencer y unidades por atender. Solo aparecen si hay algo que atender. */
export function RentalAlerts({ alerts }: RentalAlertsProps) {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const expiring = alerts.contracts_expiring_soon;
  const maintenance = alerts.units_maintenance;
  const available = alerts.units_available;
  const hasUnits = maintenance > 0 || available > 0;

  if (expiring === 0 && !hasUnits) return null;

  const expiringLabel = plural(expiring, 'contrato por vencer', 'contratos por vencer');
  const sheetDialog = <AlertSheet kind={sheet} onClose={() => setSheet(null)} />;

  if (!isDesktop) {
    return (
      <>
        <AlertList aria-label="Avisos">
          {expiring > 0 ? (
            <AlertButton type="button" $tone="warning" onClick={() => setSheet('contracts')}>
              <Icon name="calendar" size={18} strokeWidth={2.2} />
              {expiringLabel}
            </AlertButton>
          ) : null}
          {maintenance > 0 ? (
            <AlertButton type="button" $tone="warning" onClick={() => setSheet('maintenance')}>
              <Icon name="wrench" size={18} strokeWidth={2.2} />
              {maintenance} en mantenimiento
            </AlertButton>
          ) : null}
          {available > 0 ? (
            <AlertButton type="button" $tone="success" onClick={() => setSheet('available')}>
              <Icon name="door" size={18} strokeWidth={2.2} />
              {plural(available, 'disponible', 'disponibles')}
            </AlertButton>
          ) : null}
        </AlertList>
        {sheetDialog}
      </>
    );
  }

  return (
    <>
      <Sections $both={expiring > 0 && hasUnits}>
        {expiring > 0 ? (
          <Panel aria-label="Contratos por vencer">
            <PanelTitle>
              {expiringLabel} <span>· próximos 30 días</span>
            </PanelTitle>
            <ContractItems limit={SECTION_PREVIEW} />
            {expiring > SECTION_PREVIEW ? (
              <PanelFoot>
                <RowAction type="button" onClick={() => setSheet('contracts')}>
                  Ver los {expiring} contratos
                </RowAction>
              </PanelFoot>
            ) : null}
          </Panel>
        ) : null}
        {hasUnits ? (
          <Panel aria-label="Unidades por atender">
            <PanelTitle>Unidades por atender</PanelTitle>
            <Rows>
              {maintenance > 0 ? (
                <UnitRow>
                  <StatusBadge status="maintenance" compact />
                  {maintenance === 1 ? (
                    <SingleUnitLink status="maintenance" />
                  ) : (
                    <>
                      <span>{plural(maintenance, 'unidad', 'unidades')}</span>
                      <RowAction type="button" onClick={() => setSheet('maintenance')}>
                        Ver unidades
                      </RowAction>
                    </>
                  )}
                </UnitRow>
              ) : null}
              {available > 0 ? (
                <UnitRow>
                  <StatusBadge status="available" compact />
                  {available === 1 ? (
                    <SingleUnitLink status="available" />
                  ) : (
                    <>
                      <span>{plural(available, 'unidad', 'unidades')}</span>
                      <RowAction type="button" onClick={() => setSheet('available')}>
                        Ver unidades
                      </RowAction>
                    </>
                  )}
                </UnitRow>
              ) : null}
            </Rows>
          </Panel>
        ) : null}
      </Sections>
      {sheetDialog}
    </>
  );
}
