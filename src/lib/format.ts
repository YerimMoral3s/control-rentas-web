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

/** "5512345678" → "55 1234 5678". Otros largos se muestran tal como llegan. */
export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
};

/** Importe con signo de la API ("-3200.00") con el signo menos tipográfico: "−$3,200". */
export const formatSignedMoney = (amount: string): string => formatMoney(amount).replace(/^-/, '−');
