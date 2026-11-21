import styled from 'styled-components';
import type { Property } from '@api/properties';
import type { Unit } from '@api/units';
import { ButtonLink, Icon } from '@components';
import { unitStatusSummary } from '@features/properties/propertyText';
import { media, pageTitle } from '@styles/theme';
import { useSetupNavigation } from '../setupNavigation';
import {
  groupCount,
  isSingleType,
  propertyTypeOption,
  setupSubtitle,
  unitGroups,
} from '../setupText';
import { StepPanel } from './stepStyles';

const Done = styled(StepPanel)`
  max-width: 560px;
  margin: 0 auto;
  align-items: flex-start;

  h1 {
    margin: 0;
    ${pageTitle}
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral700};
  }
`;

const Mark = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.successBg};
  color: ${({ theme }) => theme.color.success};
`;

const Summary = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  strong {
    font-size: 16px;
  }

  span {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Actions = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${media.table} {
    flex-direction: row;
  }
`;

/** "Creamos 8 departamentos" / "Creamos la unidad Casa completa". */
const createdText = (property: Property, units: Unit[]) => {
  const occupied = property.unit_counts.occupied;
  const rents =
    occupied > 0
      ? ` y registramos ${occupied} ${occupied === 1 ? 'renta actual' : 'rentas actuales'}`
      : '';
  if (isSingleType(property.property_type) && units[0])
    return `Creamos su unidad, ${units[0].name}${rents}.`;
  const groups = unitGroups(units).map(group => groupCount(group.unit_type, group.count));
  return groups.length > 0 ? `Creamos ${groups.join(' y ')}${rents}.` : '';
};

/** P-12: qué quedó creado y accesos. Desde H-10, Ir a Inicio es la acción principal. */
export function SetupDone({ property, units }: { property: Property; units: Unit[] }) {
  const nav = useSetupNavigation();
  const toProperty = { to: `/propiedades/${property.id}`, children: 'Ver propiedad' };
  const toHome = { to: '/', children: 'Ir a Inicio' };
  const [primary, secondary] = nav.fromHome ? [toHome, toProperty] : [toProperty, toHome];

  return (
    <Done>
      <Mark aria-hidden="true">
        <Icon name="check" size={26} strokeWidth={2.6} />
      </Mark>
      <h1>Tu propiedad está lista</h1>
      <p>{createdText(property, units)}</p>
      <Summary>
        <strong>{property.name}</strong>
        <span>{setupSubtitle(property, propertyTypeOption(property.property_type).title)}</span>
        {unitStatusSummary(property.unit_counts) ? (
          <span>{unitStatusSummary(property.unit_counts)}</span>
        ) : null}
      </Summary>
      <p>Ya aparece en Inicio, con sus rentas en el resumen del mes.</p>
      <Actions>
        <ButtonLink to={primary.to} replace>
          {primary.children}
        </ButtonLink>
        <ButtonLink variant="secondary" to={secondary.to} replace>
          {secondary.children}
        </ButtonLink>
      </Actions>
    </Done>
  );
}
