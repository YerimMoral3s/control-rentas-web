/** Y-11 y Y-12 comparten un concepto obligatorio de hasta 150 caracteres. */
export const conceptRules = {
  validate: (value: string) => value.trim().length > 0 || 'Escribe el concepto del cargo.',
  maxLength: { value: 150, message: 'Usa hasta 150 caracteres.' },
};

/** Textos propios para los 422 de campo (nunca el mensaje del backend). */
export const chargeFieldMessages = {
  concept_reference: 'Revisa el concepto del cargo.',
  amount: 'Escribe un importe mayor a cero.',
  due_date: 'Elige una fecha de vencimiento válida.',
};
