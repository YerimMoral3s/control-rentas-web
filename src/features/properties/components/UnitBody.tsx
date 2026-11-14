import { useState } from 'react';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import type { Unit } from '@api/units';
import {
  ActionLink,
  ActionMenu,
  Button,
  DetailSection,
  ListFooter,
  MutedText,
  Notice,
  Panel,
  SectionError,
  Skeleton,
  StatusBadge,
  type ActionMenuItem,
} from '@components';
import { useContracts } from '@hooks/querys/contracts';
import { formatDateRange, formatDateWithYear } from '@lib/dates';
import { formatMoney, formatPhone } from '@lib/format';
import { media, theme as tokens } from '@styles/theme';
import { contractTypeLabel, fullName } from '@features/tenants/tenantText';
import { ExpensesSection } from './ExpensesSection';
import { UnitStatusDialog } from './UnitStatusDialog';

/** Celular: una columna. Computadora ancha: contenido a la izquierda y gastos a la derecha. */
export const TwoColumns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  ${media.wide} {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: start;
  }
`;

export const Column = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Card = styled(Panel)`
  padding: 14px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  strong {
    font-size: 16px;
    line-height: 22px;
  }
`;

const Badges = styled.span`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const CurrentMark = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.color.infoBorder};
  background: ${({ theme }) => theme.color.infoBg};
  color: ${({ theme }) => theme.color.info};
  font-size: 12px;
  line-height: 20px;
  font-weight: 700;
  white-space: nowrap;
`;

const Line = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Links = styled.div`
  display: flex;
  gap: 4px;
  margin: 4px -10px 0;
`;

const History = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;

  li {
    padding: 12px 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: center;
    border: 1px dashed ${({ theme }) => theme.color.neutral300};
    border-radius: ${({ theme }) => theme.radius.card};
    background: ${({ theme }) => theme.color.neutral50};
  }

  strong {
    font-size: 15px;
    line-height: 22px;
  }

  li > span:last-child {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
`;

/**
 * Aviso del estado (U-02 vencido, U-03 mantenimiento) y acciones válidas: Enviar a mantenimiento
 * (U-04), Marcar como disponible (U-05) y Más acciones. Crear contrato llega en la fase 5.
 */
export function UnitStatusArea({
  unit,
  current,
  name,
  menu,
}: {
  unit: Unit;
  current: Contract | undefined;
  name: string;
  menu: ActionMenuItem[];
}) {
  const [target, setTarget] = useState<'maintenance' | 'available' | null>(null);
  const [result, setResult] = useState<{ title: string; body: string } | null>(null);
  return (
    <>
      {result ? (
        <Notice tone="success" title={result.title} onClose={() => setResult(null)}>
          {result.body}
        </Notice>
      ) : null}
      {unit.status === 'maintenance' && !result ? (
        <Notice tone="warning" title="No se puede rentar mientras esté en mantenimiento.">
          {unit.description ?? 'Cuando termine el arreglo, márcala como disponible.'}
        </Notice>
      ) : null}
      {current?.status === 'expired' ? (
        <Notice
          tone="warning"
          title={`El contrato venció el ${formatDateWithYear(current.end_date)}.`}
        >
          {fullName(current.tenant)} sigue en {name} hasta que continúes o termines el contrato.
        </Notice>
      ) : null}
      {unit.reviewed_at === null ? (
        <Notice tone="info" title="Falta revisar esta unidad">
          Se revisa al continuar la configuración de la propiedad.
        </Notice>
      ) : null}
      <Actions>
        {unit.status === 'available' && unit.reviewed_at !== null ? (
          <>
            <Button disabled title="Disponible próximamente">
              Crear contrato
            </Button>
            <Button variant="secondary" onClick={() => setTarget('maintenance')}>
              Enviar a mantenimiento
            </Button>
          </>
        ) : null}
        {unit.status === 'maintenance' ? (
          <Button onClick={() => setTarget('available')}>Marcar como disponible</Button>
        ) : null}
        <ActionMenu items={menu} />
      </Actions>
      <UnitStatusDialog
        unit={unit}
        name={name}
        target={target}
        onClose={() => setTarget(null)}
        onDone={setResult}
      />
    </>
  );
}

/** Inquilino y contrato actual (U-02, P-04). */
function CurrentContract({ contract }: { contract: Contract }) {
  return (
    <DetailSection title="Inquilino y contrato actual">
      <Card>
        <Top>
          <strong>{fullName(contract.tenant)}</strong>
          <Badges>
            <StatusBadge status={contract.status} compact />
            <CurrentMark>Contrato actual</CurrentMark>
          </Badges>
        </Top>
        <Line>{formatPhone(contract.tenant.phone)}</Line>
        <Line>
          {contractTypeLabel(contract.contract_type)} ·{' '}
          {formatDateRange(contract.start_date, contract.end_date)} ·{' '}
          {formatMoney(contract.rent_amount)} al mes
        </Line>
        <Links>
          <ActionLink to={`/contratos/${contract.id}`}>Ver contrato</ActionLink>
          <ActionLink to={`/inquilinos/${contract.tenant.id}`}>Ver inquilino</ActionLink>
        </Links>
      </Card>
    </DetailSection>
  );
}

function UnitHistory({ unitId }: { unitId: string }) {
  const query = useContracts({ unit_id: unitId, is_current: false });
  return (
    <DetailSection title="Historial">
      {query.isPending ? (
        <Skeleton $height="64px" $radius={tokens.radius.card} />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : query.items.length === 0 ? (
        <MutedText>Aún no tiene contratos anteriores.</MutedText>
      ) : (
        <>
          <History>
            {query.items.map(contract => (
              <li key={contract.id}>
                <strong>{fullName(contract.tenant)}</strong>
                <Line>
                  {contractTypeLabel(contract.contract_type)} ·{' '}
                  {formatDateRange(contract.start_date, contract.end_date)}
                </Line>
                <span>
                  <StatusBadge status={contract.status} compact />
                </span>
              </li>
            ))}
          </History>
          {query.hasNextPage || query.isFetchNextPageError ? (
            <ListFooter
              query={query}
              endLabel="No hay más contratos"
              errorLabel="No pudimos cargar más contratos"
            />
          ) : null}
        </>
      )}
    </DetailSection>
  );
}

/** Contrato actual de la unidad; solo se pide si la unidad tiene ocupación actual. */
export const useCurrentContract = (unit: Unit | undefined) => {
  const query = useContracts(
    { unit_id: unit?.id ?? '', is_current: true },
    Boolean(unit?.current_contract),
  );
  return { query, contract: query.items[0] };
};

/** Cuerpo del detalle de unidad (U-01 a U-03) y de casa o bodega (P-04). */
export function UnitBody({
  unit,
  name,
  menu,
}: {
  unit: Unit;
  /** Como se muestra la unidad (casa o bodega: el nombre de la propiedad). */
  name: string;
  menu: ActionMenuItem[];
}) {
  const { query, contract } = useCurrentContract(unit);
  const occupied = Boolean(unit.current_contract);

  return (
    <TwoColumns>
      <Column>
        <UnitStatusArea unit={unit} current={contract} name={name} menu={menu} />
        {occupied ? (
          query.isPending ? (
            <Skeleton $height="140px" $radius={tokens.radius.card} />
          ) : query.isError && !query.data ? (
            <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
          ) : contract ? (
            <CurrentContract contract={contract} />
          ) : null
        ) : null}
        <UnitHistory unitId={unit.id} />
      </Column>
      <Column>
        <ExpensesSection filters={{ unit_id: unit.id }} />
      </Column>
    </TwoColumns>
  );
}
