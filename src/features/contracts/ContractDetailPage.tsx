import { useState } from 'react';
import { NotesSection } from '@features/notes/NotesSection';
import { Link, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import {
  ActionLink,
  ActionMenu,
  Button,
  ButtonLink,
  ContractMark,
  DetailSection,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  StatusBadge,
} from '@components';
import { useContract } from '@hooks/querys/contracts';
import { formatDateRange, formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { placeName, shortPlaceName } from '@lib/place';
import { useResultNotice } from '@lib/useResultNotice';
import { media, theme as tokens, pageTitle } from '@styles/theme';
import { ContractPayments } from './components/ContractPayments';
import { ContractSummaryBlocks } from './components/ContractSummary';
import { contractKindLine, terminationDate } from './contractText';
import { TerminateContractDialog } from './terminate/TerminateContractDialog';

const Page = styled.div`
  width: 100%;
  max-width: 1040px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h1 {
    margin: 0;
    ${pageTitle}
  }
`;

const Sub = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Badges = styled.span`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Data = styled.dl`
  margin: 0;
  padding: 4px 16px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  div {
    padding: 10px 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 12px;
  }

  div + div {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  dt {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    text-align: right;

    ${media.desktop} {
      text-align: left;
    }
  }

  a {
    color: ${({ theme }) => theme.color.primary600};
  }
`;

const tenantName = (contract: Contract) =>
  `${contract.tenant.first_name} ${contract.tenant.last_name}`;

/** Aviso del estado: C-04 vencido actual, C-05 vencido histórico, C-06 terminado. */
function StatusNotice({ contract }: { contract: Contract }) {
  if (contract.status === 'expired' && contract.is_current) {
    return (
      <Notice tone="warning" title={`Venció el ${formatDateWithYear(contract.end_date)}.`}>
        {contract.tenant.first_name} sigue rentando{' '}
        {shortPlaceName(contract.unit.name, contract.property)} hasta que continúes o termines el
        contrato.
      </Notice>
    );
  }
  if (contract.status === 'terminated') {
    return (
      <Notice tone="info" title={`Terminó el ${formatDateWithYear(terminationDate(contract))}.`}>
        Aquí siguen sus cobros y su depósito.
      </Notice>
    );
  }
  if (!contract.is_current) {
    // FE-24: `next_contract` es la continuación inmediata; no se afirma que siga siendo la actual.
    return contract.next_contract ? (
      <Notice
        tone="info"
        title={`La renta continuó en otro contrato desde el ${formatDateWithYear(contract.next_contract.start_date)}.`}
        action={
          <ActionLink to={`/contratos/${contract.next_contract.id}`}>
            Ver contrato siguiente
          </ActionLink>
        }
      >
        Este contrato ya no es la ocupación actual. Puedes consultar sus cobros y registrar pagos
        atrasados.
      </Notice>
    ) : (
      <Notice tone="info" title="Este contrato ya no es la ocupación actual.">
        Puedes consultar sus cobros y registrar pagos atrasados.
      </Notice>
    );
  }
  return null;
}

/** Acciones válidas por estado. Las de cobros (fase 6) siguen deshabilitadas, sin simular. */
function ContractActions({ contract }: { contract: Contract }) {
  const navigate = useNavigate();
  const [terminating, setTerminating] = useState(false);
  const current = contract.is_current && contract.status !== 'terminated';
  const dialog = current ? (
    <TerminateContractDialog
      contract={contract}
      open={terminating}
      onClose={() => setTerminating(false)}
    />
  ) : null;
  const edit = {
    label: 'Editar contrato',
    onSelect: () => void navigate(`/contratos/${contract.id}/editar`),
  };
  // E-02: gasto de su unidad con el contrato como referencia.
  const expense = {
    label: 'Registrar gasto',
    onSelect: () => void navigate(`/gastos/nuevo?contrato=${contract.id}`),
  };
  if (contract.status === 'expired' && contract.is_current) {
    return (
      <Actions>
        {contract.next_contract ? null : (
          <ButtonLink to={`/contratos/${contract.id}/continuar`}>Continuar contrato</ButtonLink>
        )}
        <ButtonLink variant="secondary" to={`/contratos/${contract.id}/agregar-renta`}>
          Agregar renta
        </ButtonLink>
        <Button variant="secondary" onClick={() => setTerminating(true)}>
          Terminar y desocupar
        </Button>
        <ActionMenu items={[edit, expense]} />
        {dialog}
      </Actions>
    );
  }
  if (contract.status === 'active' && contract.is_current) {
    return (
      <Actions>
        <ButtonLink variant="secondary" icon="plus" to={`/contratos/${contract.id}/agregar-cargo`}>
          Agregar cargo
        </ButtonLink>
        <ActionMenu
          items={[
            edit,
            expense,
            { label: 'Terminar y desocupar', danger: true, onSelect: () => setTerminating(true) },
          ]}
        />
        {dialog}
      </Actions>
    );
  }
  if (
    contract.status === 'terminated' &&
    contract.deposit?.status === 'paid' &&
    !contract.deposit.refund
  ) {
    return (
      <Actions>
        <ButtonLink variant="secondary" to={`/contratos/${contract.id}/devolver-deposito`}>
          Devolver depósito
        </ButtonLink>
      </Actions>
    );
  }
  return null;
}

/** C-03 a C-06: detalle del contrato en el orden de la guía. */
export function ContractDetailPage() {
  const { contractId } = useParams();
  const query = useContract(contractId);
  const { result, dismiss } = useResultNotice();
  const back = <ReturnLink to="/contratos" label="Contratos" />;

  if (query.isPending) {
    return (
      <Page aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="120px" $radius={tokens.radius.card} />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage
            kind="empty"
            title="No encontramos este contrato"
            description="Puede que no exista o sea de otra cuenta. Búscalo en Contratos."
          />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </Page>
    );
  }

  const contract = query.data.data;
  const place = placeName(contract.unit.name, contract.property);

  return (
    <Page>
      {back}
      <Header>
        <h1>{tenantName(contract)}</h1>
        <Sub>
          {place} · {formatDateRange(contract.start_date, contract.end_date)}
        </Sub>
        <Badges>
          <StatusBadge status={contract.status} />
          <ContractMark current={contract.is_current} />
        </Badges>
      </Header>
      {result ? (
        <Notice tone="success" title={result.title} onClose={dismiss}>
          {result.body}
        </Notice>
      ) : null}
      <StatusNotice contract={contract} />
      <ContractSummaryBlocks contract={contract} />
      <ContractActions contract={contract} />
      <DetailSection title="Datos del contrato">
        <Data>
          <div>
            <dt>Tipo</dt>
            <dd>{contractKindLine(contract)}</dd>
          </div>
          <div>
            <dt>Fechas del contrato</dt>
            <dd>{formatDateRange(contract.start_date, contract.end_date)}</dd>
          </div>
          <div>
            <dt>Renta mensual</dt>
            <dd>{formatMoney(contract.rent_amount)}</dd>
          </div>
          <div>
            <dt>Día de pago</dt>
            <dd>{contract.fixed_due_day} de cada mes</dd>
          </div>
          <div>
            <dt>Inquilino</dt>
            <dd>
              <Link to={`/inquilinos/${contract.tenant.id}`}>{tenantName(contract)}</Link>
            </dd>
          </div>
          <div>
            <dt>Unidad</dt>
            <dd>
              <Link to={`/unidades/${contract.unit.id}`}>{place}</Link>
            </dd>
          </div>
          {contract.previous_contract_id ? (
            <div>
              <dt>Contrato anterior</dt>
              <dd>
                <Link to={`/contratos/${contract.previous_contract_id}`}>
                  Ver contrato anterior
                </Link>
              </dd>
            </div>
          ) : null}
          {contract.is_preexisting ? (
            <div>
              <dt>Origen</dt>
              <dd>Contrato que ya existía antes de usar Rentario</dd>
            </div>
          ) : null}
        </Data>
      </DetailSection>
      <ContractPayments contract={contract} />
      <NotesSection
        target={{ target_type: 'contract', target_id: contract.id }}
        label="este contrato"
      />
    </Page>
  );
}
