import type { ContractType } from '@api/contracts';
import type { PropertyType } from '@api/properties';
import { placeName as formatPlace } from '@lib/place';
import type { Tenant } from '@api/tenants';

/** Textos de inquilinos, solo presentación (los importes y estados vienen del backend). */

export const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name} ${person.last_name}`;

type PlaceUnit = { name: string; property: { name: string; property_type?: PropertyType } };

/** Lugar de una unidad del inquilino (ver `@lib/place`). */
export const placeName = (unit: PlaceUnit) => formatPlace(unit.name, unit.property);

/** Lugar de un cobro o contrato, que traen unidad y propiedad por separado. */
export const placeOf = (item: {
  unit: { name: string };
  property: { name: string; property_type?: PropertyType };
}) => formatPlace(item.unit.name, item.property);

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
