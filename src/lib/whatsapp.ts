/**
 * Enlace a WhatsApp con mensaje precargado. Nunca envía ni registra nada: la usuaria decide.
 * Teléfonos de 10 dígitos se toman como números de México (+52).
 */
export const whatsappUrl = (phone: string, message: string) => {
  const digits = phone.replace(/\D/g, '');
  const number = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};
