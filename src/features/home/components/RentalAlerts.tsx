import { useState } from 'react';
import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import type { ContractSummary } from '@api/contracts';
import type { Dashboard } from '@api/dashboard';
import { Button, Dialog, DialogActions, Icon, Skeleton, StatusBadge } from '@components';
import { useExpiringContracts } from '@hooks/querys/contracts';
import { useSingleDashboardUnit } from '@hooks/querys/units';
import { formatShortDate } from '@lib/dates';
import { useMediaQuery } from '@lib/useMediaQuery';
import { media, theme as tokens } from '@styles/theme';
import { SectionError } from './SectionError';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const contractName = (contract: ContractSummary) =>
  `${contract.tenant.first_name} ${contract.tenant.last_name}`;

/* ---------- Celular: botones de alerta (H-04 / H-05) ---------- */

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

const AlertLink = styled(Link)<{ $tone: keyof typeof alertTone }>`
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

const ContractRow = styled.li`
  min-height: 56px;
  padding: 8px 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 2px 12px;

  strong {
    font-size: 15px;
    line-height: 22px;
  }
`;

const RowPlace = styled.span`
  grid-column: 1;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const EndDate = styled.span`
  grid-column: 2;
  grid-row: 1 / span 2;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.warning};
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

  a {
    color: ${({ theme }) => theme.color.primary600};
    font-weight: 600;
  }
`;

const UnitPlace = styled.span`
  color: ${({ theme }) => theme.color.neutral700};
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

/* ---------- Piezas ---------- */

function ContractRows({ count }: { count: number }) {
  const query = useExpiringContracts(true);
  if (query.isPending) {
    return (
      <Rows aria-busy="true">
        {Array.from({ length: Math.min(count, 3) }, (_, index) => (
          <ContractRow key={index}>
            <Skeleton $height="18px" $width="60%" />
          </ContractRow>
        ))}
      </Rows>
    );
  }
  if (query.isError) {
    return <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  return (
    <Rows>
      {query.data.data.map(contract => (
        <ContractRow key={contract.id}>
          <strong>{contractName(contract)}</strong>
          <RowPlace>
            {contract.property.name} / {contract.unit.name}
          </RowPlace>
          <EndDate>Termina el {formatShortDate(contract.end_date)}</EndDate>
        </ContractRow>
      ))}
    </Rows>
  );
}

/** Nombra la unidad solo cuando hay una en ese estado (H-05). */
function SingleUnitPlace({ status }: { status: 'available' | 'maintenance' }) {
  const query = useSingleDashboardUnit(status, true);
  const unit = query.data?.data[0];
  if (!unit) return null;
  return (
    <UnitPlace>
      {unit.property.name} / {unit.name}
    </UnitPlace>
  );
}

type RentalAlertsProps = {
  alerts: Dashboard['rental_summary'];
};

/** H-04 / H-05: contratos por vencer y unidades por atender. Solo aparecen si hay algo que atender. */
export function RentalAlerts({ alerts }: RentalAlertsProps) {
  const isDesktop = useMediaQuery(`(min-width: ${tokens.breakpoint.desktop})`);
  const [contractsOpen, setContractsOpen] = useState(false);
  const expiring = alerts.contracts_expiring_soon;
  const maintenance = alerts.units_maintenance;
  const available = alerts.units_available;
  const hasUnits = maintenance > 0 || available > 0;

  if (expiring === 0 && !hasUnits) return null;

  const expiringLabel = plural(expiring, 'contrato por vencer', 'contratos por vencer');
  const maintenanceLabel = `${maintenance} en mantenimiento`;
  const availableLabel = plural(available, 'disponible', 'disponibles');

  if (!isDesktop) {
    return (
      <>
        <AlertList aria-label="Avisos">
          {expiring > 0 ? (
            <AlertButton type="button" $tone="warning" onClick={() => setContractsOpen(true)}>
              <Icon name="calendar" size={18} strokeWidth={2.2} />
              {expiringLabel}
            </AlertButton>
          ) : null}
          {maintenance > 0 ? (
            <AlertLink to="/propiedades" $tone="warning">
              <Icon name="wrench" size={18} strokeWidth={2.2} />
              {maintenanceLabel}
            </AlertLink>
          ) : null}
          {available > 0 ? (
            <AlertLink to="/propiedades" $tone="success">
              <Icon name="door" size={18} strokeWidth={2.2} />
              {availableLabel}
            </AlertLink>
          ) : null}
        </AlertList>
        <Dialog
          open={contractsOpen}
          title="Contratos por vencer"
          onClose={() => setContractsOpen(false)}
        >
          <DialogText>Contratos activos que terminan en los próximos 30 días.</DialogText>
          {contractsOpen ? (
            <DialogList>
              <ContractRows count={expiring} />
            </DialogList>
          ) : null}
          <DialogActions>
            <Button variant="neutral" fullWidth onClick={() => setContractsOpen(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Sections $both={expiring > 0 && hasUnits}>
      {expiring > 0 ? (
        <Panel aria-label="Contratos por vencer">
          <PanelTitle>
            {expiringLabel} <span>· próximos 30 días</span>
          </PanelTitle>
          <ContractRows count={expiring} />
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
                  <SingleUnitPlace status="maintenance" />
                ) : (
                  <span>{maintenanceLabel}</span>
                )}
                <Link to="/propiedades">Ver en Propiedades</Link>
              </UnitRow>
            ) : null}
            {available > 0 ? (
              <UnitRow>
                <StatusBadge status="available" compact />
                {available === 1 ? (
                  <SingleUnitPlace status="available" />
                ) : (
                  <span>{availableLabel}</span>
                )}
                <Link to="/propiedades">Ver en Propiedades</Link>
              </UnitRow>
            ) : null}
          </Rows>
        </Panel>
      ) : null}
    </Sections>
  );
}
