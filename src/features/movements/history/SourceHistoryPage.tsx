import { Navigate, useParams } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { FinancialOperation, FinancialVersion, HistorySourceType } from '@api/movements';
import {
  ActionLink,
  ListFooter,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useSourceHistory } from '@hooks/querys/movements';
import { formatDateTime, formatDateWithYear } from '@lib/dates';
import { pageTitle, theme as tokens } from '@styles/theme';
import { movementAmount, movementRelated } from '../movementText';
import {
  operationMoment,
  operationSummary,
  operationTitle,
  versionAmountLine,
  versionDateLine,
  versionPlace,
} from './historyText';

const Page = styled.div`
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Head = styled.header`
  h1 {
    margin: 0;
    ${pageTitle}
  }

  p {
    margin: 4px 0 0;
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Card = styled.section<{ $muted?: boolean }>`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: ${({ $muted, theme }) => ($muted ? theme.color.neutral50 : theme.color.white)};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};

  h2 {
    margin: 0 0 2px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: ${({ theme }) => theme.color.neutral600};
    text-transform: uppercase;
  }

  strong {
    font-size: 16px;
    color: ${({ theme }) => theme.color.neutral950};
  }

  p {
    margin: 0;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Big = styled.strong`
  && {
    font-size: 24px;
    line-height: 30px;
  }
`;

const Operations = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const isSourceType = (value: string | undefined): value is HistorySourceType =>
  value === 'payment' || value === 'expense';

/** Una versión anterior o vigente dentro de una operación. */
function Version({ version, label }: { version: FinancialVersion; label?: string }) {
  return (
    <>
      {label ? <small>{label}</small> : null}
      <strong>{versionAmountLine(version)}</strong>
      <p>{versionDateLine(version)}</p>
      <small>
        {version.kind === 'income' ? 'Relación conservada' : 'Registrado en'}:{' '}
        {versionPlace(version)}
      </small>
      {version.state === 'reversed' ? (
        <small>Ya no cuenta en Movimientos ni en los resúmenes.</small>
      ) : null}
    </>
  );
}

function OperationCard({ operation }: { operation: FinancialOperation }) {
  const summary = operationSummary(operation);
  const correction = operation.type === 'corrected' || operation.type === 'voided';
  return (
    <li>
      <Card $muted={!correction}>
        <h2>{operationTitle(operation)}</h2>
        {summary ? <p>{summary}</p> : null}
        <small>{operationMoment(operation)}</small>
        {correction && operation.before ? (
          <Version version={operation.before} label="Antes" />
        ) : null}
        {operation.after ? (
          <Version version={operation.after} label={correction ? 'Después' : undefined} />
        ) : null}
      </Card>
    </li>
  );
}

/** M-06: historial de solo lectura de un pago o gasto. No se edita ni se agregan notas aquí. */
export function SourceHistoryPage() {
  const { sourceType, sourceId } = useParams();
  const type = isSourceType(sourceType) ? sourceType : 'payment';
  const query = useSourceHistory(type, sourceId, isSourceType(sourceType));
  const back = <ReturnLink to="/movimientos/historial" label="Historial de correcciones" />;

  if (!isSourceType(sourceType)) return <Navigate to="/movimientos/historial" replace />;

  if (query.isPending)
    return (
      <Page aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="160px" $radius={tokens.radius.card} />
      </Page>
    );

  if (query.isError && !query.data)
    return (
      <Page>
        {back}
        {isAppError(query.error) && query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos este historial" />
        ) : (
          <SectionError
            title="No pudimos cargar el historial"
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}
      </Page>
    );

  const history = query.meta?.history;
  const current = history?.current_result ?? null;
  // Encabezado: la versión vigente o, si no hay, la más reciente que se conoce.
  const latest = query.items.find(item => item.after)?.after ?? query.items[0]?.before ?? null;
  const title = current?.concept ?? latest?.concept ?? 'Historial';
  const kind = type === 'payment' ? 'Pago' : 'Gasto';
  const place = current ? movementRelated(current) : latest ? versionPlace(latest) : '';
  const original = type === 'payment' ? `/cobros/${sourceId ?? ''}` : `/gastos/${sourceId ?? ''}`;

  return (
    <Page>
      {back}
      <Head>
        <h1>{title}</h1>
        <p>
          {kind}
          {place ? ` · ${place}` : ''}
        </p>
      </Head>
      {current ? (
        <Card>
          <h2>Resultado vigente</h2>
          <Big>{movementAmount(current.amount)}</Big>
          <p>
            {type === 'payment' ? 'Fecha del pago' : 'Fecha del gasto'}:{' '}
            {current.occurred_at
              ? formatDateTime(current.occurred_at)
              : formatDateWithYear(current.date)}
          </p>
          <small>
            Corregir una captura no significa que entró o salió dinero el día de la corrección.
          </small>
          <ActionLink to={original}>Ver {type === 'payment' ? 'pago' : 'gasto'}</ActionLink>
        </Card>
      ) : (
        <Card $muted>
          <h2>Sin resultado vigente</h2>
          <p>
            {type === 'payment'
              ? 'Este pago no cuenta hoy como dinero recibido. Su historial se conserva para consulta.'
              : 'Este gasto fue una captura errónea y ya no cuenta en Movimientos ni en los resúmenes. Su historial se conserva únicamente para consulta.'}
          </p>
          {type === 'expense' ? (
            <small>No se puede editar, reactivar ni agregar notas desde aquí.</small>
          ) : (
            <ActionLink to={original}>Ver pago</ActionLink>
          )}
        </Card>
      )}
      {query.items.length === 0 ? (
        <StateMessage kind="empty" title="Este registro no tiene historial financiero" />
      ) : (
        <div aria-busy={query.isPlaceholderData || undefined}>
          <Operations aria-label="Operaciones">
            {query.items.map(operation => (
              <OperationCard key={operation.id} operation={operation} />
            ))}
          </Operations>
          <ListFooter
            query={query}
            endLabel="Este es el registro original"
            errorLabel="No pudimos cargar más del historial"
          />
        </div>
      )}
    </Page>
  );
}
