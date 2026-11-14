import { Link } from 'react-router';
import styled from 'styled-components';
import type { Property } from '@api/properties';
import { Button, FROM_LIST_STATE, Icon, StatusBadge } from '@components';
import { media } from '@styles/theme';
import {
  isSingleUnit,
  propertyTypeLabel,
  shortLocation,
  unitCountLabel,
  unitStatusSummary,
} from '../propertyText';

/** En computadora, la lista es una tabla con borde; en celular, tarjetas sueltas. */
export const List = styled.ul<{ $inBox?: boolean }>`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${media.desktop} {
    gap: 0;
    background: ${({ theme }) => theme.color.white};
    border: ${({ $inBox, theme }) => ($inBox ? '0' : `1px solid ${theme.color.neutral200}`)};
    border-radius: ${({ $inBox, theme }) => ($inBox ? '0' : theme.radius.card)};
    overflow: hidden;

    li + li {
      border-top: 1px solid ${({ theme }) => theme.color.neutral200};
    }
  }
`;

export const TableBox = styled.div`
  ${media.desktop} {
    border: 1px solid ${({ theme }) => theme.color.neutral200};
    border-radius: ${({ theme }) => theme.radius.card};
    overflow: hidden;
  }
`;

const COLUMNS = 'minmax(0, 1.3fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 1.4fr) 24px';

export const ListHeader = styled.div`
  display: none;

  ${media.desktop} {
    display: grid;
    grid-template-columns: ${COLUMNS};
    gap: 16px;
    padding: 12px 20px;
    background: ${({ theme }) => theme.color.neutral50};
    border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Row = styled(Link)`
  padding: 14px 12px 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  ${media.desktop} {
    min-height: 64px;
    padding: 10px 20px;
    display: grid;
    grid-template-columns: ${COLUMNS};
    gap: 16px;
    border: 0;
    border-radius: 0;
  }
`;

const Main = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 16px;
    line-height: 22px;
  }
`;

const Aux = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const DesktopCell = styled.span`
  display: none;
  font-size: 15px;
  color: ${({ theme }) => theme.color.neutral700};

  ${media.desktop} {
    display: block;
  }
`;

const MobileOnly = styled.span`
  ${media.desktop} {
    display: none;
  }
`;

const Chevron = styled.span`
  display: flex;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Side = styled.span`
  display: flex;
  align-items: center;

  ${media.desktop} {
    display: none;
  }
`;

const StatusCell = styled(DesktopCell)`
  ${media.desktop} {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const tenantName = (tenant: { first_name: string; last_name: string }) =>
  `${tenant.first_name} ${tenant.last_name}`;

/** P-01: fila o tarjeta de una propiedad completa; abre su detalle. */
export function PropertyRow({ property }: { property: Property }) {
  const location = shortLocation(property);
  const single = isSingleUnit(property.property_type) ? property.single_unit : null;
  const counts = unitStatusSummary(property.unit_counts);
  const badge =
    single && single.status !== 'inactive' ? <StatusBadge status={single.status} compact /> : null;

  return (
    <li>
      <Row to={`/propiedades/${property.id}`} state={FROM_LIST_STATE}>
        <Main>
          {/* Casa o bodega: la unidad es el título y la propiedad, el texto secundario (FE-16). */}
          <strong>{single ? single.name : property.name}</strong>
          <Aux>{single ? property.name : location}</Aux>
          <MobileOnly>
            <Aux>
              {single
                ? single.tenant
                  ? tenantName(single.tenant)
                  : ''
                : [
                    `${propertyTypeLabel(property.property_type)} · ${unitCountLabel(property.unit_counts.total)}`,
                    counts,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
            </Aux>
          </MobileOnly>
        </Main>
        <Side>{badge}</Side>
        <DesktopCell>{propertyTypeLabel(property.property_type)}</DesktopCell>
        <DesktopCell>{unitCountLabel(property.unit_counts.total)}</DesktopCell>
        <StatusCell>
          {single ? (
            <>
              {badge}
              {single.tenant ? tenantName(single.tenant) : null}
            </>
          ) : (
            counts || '—'
          )}
        </StatusCell>
        <Chevron>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </Chevron>
      </Row>
    </li>
  );
}

const Incomplete = styled.li`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${({ theme }) => theme.color.warningBg};
  border: 1px solid ${({ theme }) => theme.color.warningBorder};
  border-radius: ${({ theme }) => theme.radius.card};

  ${media.desktop} {
    border-radius: 0;
    border-width: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const IncompleteText = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  strong {
    font-size: 16px;
    line-height: 22px;
  }
`;

const Progress = styled.span`
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.warning};
`;

/** P-01 / P-02: propiedad incompleta, primero en la lista. Continuar configuración llega en la fase 4. */
export function IncompletePropertyRow({ property }: { property: Property }) {
  const { reviewed_units, total_units } = property.configuration_progress;
  return (
    <Incomplete>
      <IncompleteText to={`/propiedades/${property.id}`} state={FROM_LIST_STATE}>
        <strong>{property.name}</strong>
        <Aux>{propertyTypeLabel(property.property_type)} · aparecerá en Inicio al terminar</Aux>
        <Progress>
          Configuración incompleta · {reviewed_units} de {total_units} unidades revisadas
        </Progress>
      </IncompleteText>
      <Button variant="secondary" disabled title="Disponible próximamente">
        Continuar configuración
      </Button>
    </Incomplete>
  );
}
