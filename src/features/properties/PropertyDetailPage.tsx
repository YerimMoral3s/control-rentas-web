import { useState } from 'react';
import { NotesSection } from '@features/notes/NotesSection';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import type { Property } from '@api/properties';
import {
  ActionMenu,
  DetailSection,
  ListFooter,
  MutedText,
  ButtonLink,
  Notice,
  Panel,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
  StatusBadge,
  type ActionMenuItem,
} from '@components';
import { useContracts } from '@hooks/querys/contracts';
import { useProperty } from '@hooks/querys/properties';
import { QueryPageSize } from '@hooks/querys/queryBase';
import { usePropertyUnits } from '@hooks/querys/units';
import { useResultNotice } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import { DeletePropertyDialog } from './components/DeletePropertyDialog';
import { Actions, Column, TwoColumns, UnitBody } from './components/UnitBody';
import { DetailHeader, DetailPage } from './components/DetailHeader';
import { RecentExpensesSection } from './components/RecentExpensesSection';
import { UnitRow, UnitRows } from './components/UnitList';
import {
  addressLine,
  isSingleUnit,
  propertyTypeLabel,
  unitCountLabel,
  unitStatusSummary,
} from './propertyText';

const Address = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** P-02: propiedad incompleta. El avance viene del backend (unidades revisadas de su total). */
function IncompleteNotice({ property }: { property: Property }) {
  if (property.configuration_status === 'completed') return null;
  const { reviewed_units, total_units } = property.configuration_progress;
  return (
    <Notice
      tone="warning"
      title="Falta terminar esta propiedad"
      action={
        <ButtonLink to={`/propiedades/${property.id}/configurar`}>
          Continuar configuración
        </ButtonLink>
      }
    >
      Todavía no aparece en Inicio. {reviewed_units} de {total_units} unidades revisadas.
    </Notice>
  );
}

/** P-03: unidades de la propiedad, con quién renta cada una. */
function UnitsSection({ property }: { property: Property }) {
  const units = usePropertyUnits(property.id);
  // Contratos actuales de toda la propiedad para nombrar al inquilino de cada unidad sin pedir una por una.
  const contracts = useContracts(
    { property_id: property.id, is_current: true },
    true,
    QueryPageSize.max,
  );
  const byUnit = new Map(contracts.items.map(contract => [contract.unit.id, contract]));

  return (
    <DetailSection title="Unidades" count={property.unit_counts.total}>
      {units.isPending ? (
        <Skeleton $height="192px" $radius={tokens.radius.card} />
      ) : units.isError && !units.data ? (
        <SectionError onRetry={() => void units.refetch()} retrying={units.isFetching} />
      ) : units.items.length === 0 ? (
        <MutedText>Esta propiedad aún no tiene unidades.</MutedText>
      ) : (
        <Panel>
          <UnitRows>
            {units.items.map(unit => (
              <UnitRow key={unit.id} unit={unit} contract={byUnit.get(unit.id)} />
            ))}
          </UnitRows>
          {units.hasNextPage || units.isFetchNextPageError ? (
            <ListFooter
              query={units}
              endLabel="No hay más unidades"
              errorLabel="No pudimos cargar más unidades"
            />
          ) : null}
        </Panel>
      )}
    </DetailSection>
  );
}

/** P-04: casa o bodega. Propiedad y su única unidad en una sola pantalla. */
function SingleUnitProperty({
  property,
  propertyMenu,
}: {
  property: Property;
  propertyMenu: ActionMenuItem[];
}) {
  const units = usePropertyUnits(property.id);
  const navigate = useNavigate();
  const unit = units.items[0];

  if (units.isPending) return <Skeleton $height="160px" $radius={tokens.radius.card} />;
  if (units.isError && !units.data) {
    return <SectionError onRetry={() => void units.refetch()} retrying={units.isFetching} />;
  }

  return (
    <>
      <DetailHeader
        title={property.name}
        subtitle={propertyTypeLabel(property.property_type)}
        badge={unit && unit.status !== 'inactive' ? <StatusBadge status={unit.status} /> : null}
      >
        <Address>{addressLine(property)}</Address>
      </DetailHeader>
      <IncompleteNotice property={property} />
      {unit ? (
        <UnitBody
          unit={unit}
          name={property.name}
          menu={[
            ...(unit.status === 'available' && unit.reviewed_at
              ? [
                  {
                    label: 'Registrar contrato existente',
                    onSelect: () => void navigate(`/unidades/${unit.id}/contrato-existente`),
                  },
                ]
              : []),
            ...propertyMenu,
          ]}
        />
      ) : (
        <MutedText>Esta propiedad aún no tiene su unidad.</MutedText>
      )}
    </>
  );
}

/** P-03 y P-04: detalle de propiedad. */
export function PropertyDetailPage() {
  const { propertyId } = useParams();
  const query = useProperty(propertyId);
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { result, dismiss } = useResultNotice();
  const back = <ReturnLink to="/propiedades" label="Propiedades" />;

  if (query.isPending) {
    return (
      <DetailPage aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="192px" $radius={tokens.radius.card} />
      </DetailPage>
    );
  }

  if (query.isError) {
    return (
      <DetailPage>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage
            kind="empty"
            title="No encontramos esta propiedad"
            description="Puede que se haya eliminado. Vuelve a la lista para buscarla."
          />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </DetailPage>
    );
  }

  const property = query.data.data;
  // P-15: editar o eliminar la propiedad (en casa o bodega, también desde su única unidad).
  const propertyMenu: ActionMenuItem[] = [
    {
      label: 'Editar propiedad',
      onSelect: () => void navigate(`/propiedades/${property.id}/editar`),
    },
    { label: 'Eliminar propiedad', danger: true, onSelect: () => setDeleting(true) },
  ];
  const notice = result ? (
    <Notice tone="success" title={result.title} onClose={dismiss}>
      {result.body}
    </Notice>
  ) : null;
  const deleteDialog = (
    <DeletePropertyDialog property={property} open={deleting} onClose={() => setDeleting(false)} />
  );

  if (isSingleUnit(property.property_type)) {
    return (
      <DetailPage>
        {back}
        {notice}
        <SingleUnitProperty property={property} propertyMenu={propertyMenu} />
        <NotesSection
          target={{ target_type: 'property', target_id: property.id }}
          label="esta propiedad"
        />
        {deleteDialog}
      </DetailPage>
    );
  }

  return (
    <DetailPage>
      {back}
      <DetailHeader
        title={property.name}
        subtitle={[
          `${propertyTypeLabel(property.property_type)} · ${unitCountLabel(property.unit_counts.total)}`,
          unitStatusSummary(property.unit_counts),
        ]
          .filter(Boolean)
          .join(' · ')}
      >
        <Address>{addressLine(property)}</Address>
      </DetailHeader>
      {notice}
      <IncompleteNotice property={property} />
      <Actions>
        {/* P-14: no aparece en casa ni bodega. */}
        <ButtonLink
          variant="secondary"
          icon="plus"
          to={`/propiedades/${property.id}/unidades/agregar`}
        >
          Agregar unidades
        </ButtonLink>
        <ActionMenu items={propertyMenu} />
      </Actions>
      <TwoColumns>
        <Column>
          <UnitsSection property={property} />
        </Column>
        <Column>
          <RecentExpensesSection propertyId={property.id} />
        </Column>
      </TwoColumns>
      <NotesSection
        target={{ target_type: 'property', target_id: property.id }}
        label="esta propiedad"
      />
      {deleteDialog}
    </DetailPage>
  );
}
