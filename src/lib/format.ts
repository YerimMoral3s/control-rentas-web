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
