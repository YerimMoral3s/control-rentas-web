import type { FinancialOperation, FinancialVersion, HistoryOrigin } from '@api/movements';
import { civilDateOf, formatDateTime, formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { movementTypeName } from '@lib/labels';
import { placeName } from '@lib/place';

/** Textos del historial de correcciones (M-05, M-06). Solo presentación: BACK agrupa y resuelve. */

/** Importe sin signo ("$1,200"); el signo ya lo dice "Gasto" o "Pago". */
const money = (amount: string) => formatMoney(Math.abs(Number(amount)));

/** "Torre Centro / Departamento 102" o solo la propiedad. */
export const versionPlace = (version: FinancialVersion) =>
  version.context.unit
    ? placeName(version.context.unit.name, version.context.property)
    : version.context.property.name;

/** "María López · Torre Centro / Departamento 101 · Pago" (persona si la hay). */
export const originContext = (origin: HistoryOrigin) => {
  const version = origin.latest_posting;
  const person = version.context.tenant
    ? `${version.context.tenant.first_name} ${version.context.tenant.last_name}`
    : null;
  return [person, versionPlace(version), origin.source.type === 'payment' ? 'Pago' : 'Gasto']
    .filter(Boolean)
    .join(' · ');
};

/** "Gasto de $1,200" o "Pago de $8,500". */
export const versionAmountLine = (version: FinancialVersion) =>
  `${version.kind === 'income' ? 'Pago' : 'Gasto'} de ${money(version.amount)}`;

/** "Fecha del gasto: 24 oct. 2026" o "Fecha del pago: 27 oct. 2026 a las 10:24". */
export const versionDateLine = (version: FinancialVersion) =>
  version.kind === 'income'
    ? `Fecha del pago: ${version.occurred_at ? formatDateTime(version.occurred_at) : formatDateWithYear(version.date)}`
    : `Fecha del gasto: ${formatDateWithYear(version.date)}`;

/** Título de cada operación según la traducción de BACK. */
export const operationTitle = (operation: FinancialOperation) => {
  switch (operation.type) {
    case 'recorded':
      return 'Registro original';
    case 'received_again':
      return 'Pago registrado nuevamente';
    default:
      return 'Corrección';
  }
};

/**
 * Qué cambió. Solo compara los campos que BACK ya resolvió en before/after para elegir el texto;
 * no calcula diferencias de dinero.
 */
export const operationSummary = (operation: FinancialOperation) => {
  const { before, after } = operation;
  if (operation.type === 'voided') return 'El gasto se dejó sin efecto.';
  if (operation.type === 'corrected' && before && !after)
    return before.kind === 'income'
      ? 'El pago se dejó sin efecto.'
      : 'El registro se dejó sin efecto.';
  if (operation.type === 'corrected' && before && after) {
    const changes: string[] = [];
    if (before.amount !== after.amount)
      changes.push(`el importe de ${money(before.amount)} a ${money(after.amount)}`);
    if (before.date !== after.date)
      changes.push(
        `la fecha de ${formatDateWithYear(before.date)} a ${formatDateWithYear(after.date)}`,
      );
    if (before.type !== after.type)
      changes.push(
        `la categoría de ${movementTypeName(before.type)} a ${movementTypeName(after.type)}`,
      );
    if (before.concept !== after.concept)
      changes.push(`la descripción de “${before.concept}” a “${after.concept}”`);
    if (versionPlace(before) !== versionPlace(after))
      changes.push(`el destino de ${versionPlace(before)} a ${versionPlace(after)}`);
    return changes.length > 0 ? `Se corrigió ${changes.join(', ')}.` : 'Se corrigió el registro.';
  }
  if (operation.type === 'received_again')
    return 'Es una recepción nueva, con su propia fecha. No sustituye automáticamente a la anterior.';
  return null;
};

/** "Corregido el 14 nov. 2026 a las 10:42" (momento de la acción, no la fecha financiera). */
export const operationMoment = (operation: FinancialOperation) =>
  operation.type === 'recorded' || operation.type === 'received_again'
    ? `Registrado el ${formatDateTime(operation.recorded_at)}`
    : `Corregido el ${formatDateTime(operation.recorded_at)}`;

/** "Última corrección: 14 nov. 2026". */
export const lastCorrectionLine = (origin: HistoryOrigin) =>
  `Última corrección: ${formatDateWithYear(civilDateOf(origin.last_corrected_at))}`;

/** "Vigente · $1,000" o "Sin resultado vigente". */
export const resultLine = (origin: HistoryOrigin) =>
  origin.current_result
    ? `Vigente · ${money(origin.current_result.amount)}`
    : 'Sin resultado vigente';
