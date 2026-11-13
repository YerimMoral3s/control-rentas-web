import type { ContractType } from '@api/contracts';
import type { PropertyType } from '@api/properties';
import type { Tenant } from '@api/tenants';

/** Textos de inquilinos, solo presentación (los importes y estados vienen del backend). */

export const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name} ${person.last_name}`;

type PlaceUnit = { name: string; property: { name: string; property_type?: PropertyType } };

/**
 * Lugar como lo escribe T-01: casa o bodega "Casa 1 · Fraccionamiento Sol" (propiedad y su única
 * unidad juntas); edificio, plaza o mixta "Torre Centro / Departamento 203". Sin tipo, la segunda.
 */
export const placeName = (unit: PlaceUnit) => {
  const type = unit.property.property_type;
  return type === 'house' || type === 'warehouse'
    ? `${unit.name} · ${unit.property.name}`
    : `${unit.property.name} / ${unit.name}`;
};

/** Tipo de cada propiedad del inquilino (ocupaciones y adeudos), para nombrar cobros y contratos. */
export const propertyTypes = (tenant: Tenant) => {
  const types = new Map<string, PropertyType>();
  for (const { unit } of tenant.current_contracts)
    types.set(unit.property.id, unit.property.property_type);
  for (const { unit } of tenant.overdue_debt.by_unit)
    types.set(unit.property.id, unit.property.property_type);
  return types;
};

/** Lugar de un cobro o contrato (que solo traen ids y nombres) con el tipo conocido del inquilino. */
export const placeOf = (
  item: { unit: { name: string }; property: { id: string; name: string } },
  types: Map<string, PropertyType>,
) =>
  placeName({
    name: item.unit.name,
    property: { name: item.property.name, property_type: types.get(item.property.id) },
  });

/** Encabezado del detalle: "Actualmente renta 2 unidades" o "No renta ninguna unidad actualmente". */
export const rentingLine = (tenant: Tenant) => {
  const count = tenant.current_contracts.length;
  if (count === 0) return 'No renta ninguna unidad actualmente';
  return `Actualmente renta ${count} ${count === 1 ? 'unidad' : 'unidades'}`;
};

/** Columna "Unidades que renta" de la lista: la unidad, o cuántas y cuáles. */
export const occupationSummary = (tenant: Tenant): { title: string; detail: string | null } => {
  const units = tenant.current_contracts.map(contract => contract.unit);
  const [first] = units;
  if (!first) return { title: 'No renta ninguna unidad', detail: null };
  if (units.length === 1) return { title: placeName(first), detail: null };
  return { title: `${units.length} unidades`, detail: units.map(unit => unit.name).join(', ') };
};

export const hasOverdueDebt = (tenant: Tenant) => Number(tenant.overdue_debt.amount) > 0;

export const contractTypeLabel = (type: ContractType) =>
  type === 'trial' ? 'Contrato de prueba' : 'Contrato formal';
