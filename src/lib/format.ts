const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Presenta un importe tal como lo entrega la API ("8500.00"). No suma ni recalcula:
 * los totales siempre vienen del backend.
 */
export const formatMoney = (amount: string | number): string => {
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return '—';
  return moneyFormatter.format(value);
};

/** "5512345678" → "55 12 34 56 78" (mismo formato que la captura). Otros largos, tal como llegan. */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ');
};

/** Importe con signo de la API ("-3200.00") con el signo menos tipográfico: "−$3,200". */
export const formatSignedMoney = (amount: string): string => formatMoney(amount).replace(/^-/, '−');

/**
 * FE-28 (confirmado por el usuario, 13 nov.): solo teléfonos de México. Acepta 10 dígitos, con
 * espacios o con el prefijo 52; devuelve los 10 dígitos, o null si no es un teléfono válido.
 */
export const normalizeMexicanPhone = (value: string): string | null => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2);
  return null;
};
