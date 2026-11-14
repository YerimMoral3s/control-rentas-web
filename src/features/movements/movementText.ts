import type { Movement } from '@api/movements';
import { formatTime } from '@lib/dates';
import { movementTypeName } from '@lib/labels';
import { placeName } from '@lib/place';

/** Textos de Movimientos, solo presentación (importes y signos vienen del backend). */

/** "María López · Torre Centro / Departamento 101", el inmueble solo o la persona sola. */
export const movementRelated = (movement: Movement) => {
  const person = movement.tenant
    ? `${movement.tenant.first_name} ${movement.tenant.last_name}`
    : null;
  const place = movement.property
    ? movement.unit
      ? placeName(movement.unit.name, movement.property)
      : movement.property.name
    : (movement.unit?.name ?? null);
  return [person, place].filter(Boolean).join(' · ');
};

/** "Entrada · Renta · 10:24 a. m." o "Gasto · Mantenimiento" (un gasto solo tiene fecha). */
export const movementKindLine = (movement: Movement) =>
  [
    movement.kind === 'income' ? 'Entrada' : 'Gasto',
    movementTypeName(movement.type),
    movement.occurred_at ? formatTime(movement.occurred_at) : null,
  ]
    .filter(Boolean)
    .join(' · ');

/** "+$8,500" o "−$3,200": el signo viene en el importe; solo se muestra. */
export const movementAmount = (amount: string) => {
  const value = Number(amount);
  const text = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${value < 0 ? '−' : '+'}${text}`;
};

/** Cada movimiento abre su pago o gasto original. */
export const movementLink = (movement: Movement) =>
  movement.source.type === 'payment'
    ? `/cobros/${movement.source.id}`
    : `/gastos/${movement.source.id}`;

/** Agrupa la lista ya ordenada por fecha (del backend) en días consecutivos. */
export const groupByDate = (movements: Movement[]) => {
  const groups: Array<{ date: string; items: Movement[] }> = [];
  for (const movement of movements) {
    const last = groups[groups.length - 1];
    if (last && last.date === movement.date) last.items.push(movement);
    else groups.push({ date: movement.date, items: [movement] });
  }
  return groups;
};
