import type { GeneralExpenseType } from '@api/expenses';
import type { Property } from '@api/properties';
import type { Unit } from '@api/units';
import { EXPENSE_TYPES } from '@lib/labels';
import { placeName } from '@lib/place';

/** Destino de un gasto: una propiedad completa o una unidad (exactamente uno). */
export type ExpenseDestination =
  | { kind: 'property'; property: Pick<Property, 'id' | 'name' | 'property_type'> }
  | { kind: 'unit'; unit: Pick<Unit, 'id' | 'name' | 'property'> };

/** "Torre Centro / Departamento 102" o "Torre Centro". */
export const destinationName = (destination: ExpenseDestination) =>
  destination.kind === 'property'
    ? destination.property.name
    : placeName(destination.unit.name, destination.unit.property);

/** "Unidad" o "Toda la propiedad". */
export const destinationKindLabel = (destination: ExpenseDestination) =>
  destination.kind === 'property' ? 'Toda la propiedad' : 'Unidad';

/** Cuerpo del alta: `property_id` o `unit_id`. */
export const destinationBody = (destination: ExpenseDestination) =>
  destination.kind === 'property'
    ? { property_id: destination.property.id }
    : { unit_id: destination.unit.id };

/** Categorías de un gasto general: sin Devolución de depósito (se registra desde el depósito). */
export const CATEGORIES = EXPENSE_TYPES.filter(
  (type): type is GeneralExpenseType => type !== 'deposit_refund',
);

/** FE-27: descripción de hasta 200 caracteres (contados con `Array.from`). */
export const DESCRIPTION_MAX = 200;
