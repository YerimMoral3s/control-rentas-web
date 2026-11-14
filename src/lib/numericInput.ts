/**
 * Limpieza de captura para campos numéricos. Solo presentación: no redondea ni calcula importes.
 */

/** Importe: solo dígitos y un punto decimal, con máximo 2 decimales. */
export const sanitizeMoney = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [integer = '', ...decimals] = cleaned.split('.');
  if (decimals.length === 0) return integer;
  return `${integer}.${decimals.join('').slice(0, 2)}`;
};

/** Agrega separador de miles al salir del campo: "8500.5" → "8,500.5". */
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

/** Posición del cursor después de aplicar la máscara: tras el mismo número de dígitos que antes. */
export const phoneCaret = (masked: string, digitsBeforeCaret: number) => {
  if (digitsBeforeCaret <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < masked.length; index += 1) {
    if (/\d/.test(masked[index] ?? '')) seen += 1;
    if (seen === digitsBeforeCaret) return index + 1;
  }
  return masked.length;
};
