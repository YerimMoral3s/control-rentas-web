import type { ContractType } from '@api/contracts';
import type { Tenant } from '@api/tenants';

/** Textos de inquilinos, solo presentación (los importes y estados vienen del backend). */

export const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name} ${person.last_name}`;

export const placeName = (unit: { name: string; property: { name: string } }) =>
  `${unit.property.name} / ${unit.name}`;

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
