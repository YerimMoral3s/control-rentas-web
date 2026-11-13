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

/** Teléfono: solo dígitos y espacios. */
export const sanitizePhone = (value: string): string => value.replace(/[^\d ]/g, '');
