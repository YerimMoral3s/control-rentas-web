/**
 * Limpieza de captura para campos numéricos. Solo presentación: no redondea ni calcula importes.
 */

/** Máximo de la API para importes: 9,999,999,999.99 (10 dígitos enteros). */
const MONEY_MAX_INTEGER_DIGITS = 10;

/** Importe: solo dígitos y un punto decimal, con máximo 10 enteros y 2 decimales. */
export const sanitizeMoney = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [rawInteger = '', ...decimals] = cleaned.split('.');
  // Sin ceros a la izquierda ("007" → "7"), pero conserva un "0" antes del punto.
  const integer = rawInteger.replace(/^0+(?=\d)/, '').slice(0, MONEY_MAX_INTEGER_DIGITS);
  if (decimals.length === 0) return integer;
  return `${integer || '0'}.${decimals.join('').slice(0, 2)}`;
};

/**
 * Máscara de importe mientras se escribe (pedido del usuario, 14 nov.): separador de miles,
 * "10000.5" → "10,000.5". Solo presentación: no redondea.
 */
export const formatMoneyInput = (value: string): string => {
  const clean = sanitizeMoney(value);
  if (!clean) return '';
  const [integer = '', decimals] = clean.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
};

const phoneDigits = (value: string, pasted: boolean) => {
  const digits = value.replace(/\D/g, '');
  // Al pegar "+52 55…" o "52 55…" se quita la lada del país (FE-28: solo México).
  const local =
    pasted && digits.length === 12 && digits.startsWith('52') ? digits.slice(2) : digits;
  return local.slice(0, 10);
};

/**
 * Máscara de teléfono de México (acuerdo del 13 nov.): máximo 10 dígitos en grupos de dos,
 * "55 12 34 56 78", que sirve igual para ladas de 2 y de 3 dígitos.
 */
export const sanitizePhone = (value: string, pasted = false): string =>
  phoneDigits(value, pasted).replace(/(\d{2})(?=\d)/g, '$1 ');

/**
 * Posición del cursor después de aplicar una máscara: tras el mismo número de caracteres útiles
 * (dígitos, y el punto en importes) que había antes del cursor.
 */
export const maskCaret = (masked: string, usefulBeforeCaret: number, useful = /\d/) => {
  if (usefulBeforeCaret <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < masked.length; index += 1) {
    if (useful.test(masked[index] ?? '')) seen += 1;
    if (seen === usefulBeforeCaret) return index + 1;
  }
  return masked.length;
};
