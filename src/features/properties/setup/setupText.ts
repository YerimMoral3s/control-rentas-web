import type { Property, PropertyType } from '@api/properties';
import type { Unit, UnitType } from '@api/units';

/** Textos y reglas de presentación del recorrido P-05 a P-12. No calcula importes. */

export const SETUP_STEPS = [
  { key: 'tipo', label: 'Tipo y datos' },
  { key: 'unidades', label: 'Unidades' },
  { key: 'estados', label: 'Estados y rentas' },
  { key: 'revisar', label: 'Revisar' },
] as const;

export type SetupStep = (typeof SETUP_STEPS)[number]['key'];

export const isSetupStep = (value: string | undefined): value is SetupStep =>
  SETUP_STEPS.some(step => step.key === value);

/** P-05: textos de cada tipo tal como el diseño. */
export const PROPERTY_TYPE_OPTIONS: ReadonlyArray<{
  value: PropertyType;
  title: string;
  description: string;
  units: string;
}> = [
  {
    value: 'house',
    title: 'Casa',
    description: 'Se renta completa.',
    units: 'Crea una sola unidad: Casa completa.',
  },
  {
    value: 'warehouse',
    title: 'Bodega',
    description: 'Se renta completa.',
    units: 'Crea una sola unidad: Bodega.',
  },
  {
    value: 'building',
    title: 'Edificio',
    description: 'Varios espacios en un mismo inmueble.',
    units: 'Puede tener departamentos o locales.',
  },
  {
    value: 'shopping_plaza',
    title: 'Plaza de locales',
    description: 'Un conjunto de locales comerciales.',
    units: 'Solo puede tener locales.',
  },
  {
    value: 'mixed_use',
    title: 'Propiedad mixta',
    description: 'Viviendas y comercios juntos.',
    units: 'Puede tener departamentos y locales.',
  },
];

export const propertyTypeOption = (type: PropertyType) =>
  // Siempre existe: hay una opción por cada PropertyType.
  PROPERTY_TYPE_OPTIONS.find(
    option => option.value === type,
  ) as (typeof PROPERTY_TYPE_OPTIONS)[number];

/** Casa y bodega: su única unidad se crea sola con este nombre (acuerdo de 4B). */
export const SINGLE_UNIT: Partial<Record<PropertyType, { name: string; unit_type: UnitType }>> = {
  house: { name: 'Casa completa', unit_type: 'full_house' },
  warehouse: { name: 'Bodega', unit_type: 'warehouse' },
};

/** Casa y bodega: una sola unidad. */
export const isSingleType = (type: PropertyType) => Boolean(SINGLE_UNIT[type]);

/** Matriz de tipos del backend: qué grupos se pueden agregar en P-07. */
export const groupTypesFor = (type: PropertyType): UnitType[] => {
  if (type === 'building' || type === 'mixed_use') return ['apartment', 'commercial_space'];
  if (type === 'shopping_plaza') return ['commercial_space'];
  return [];
};

const GROUP_WORDS: Partial<Record<UnitType, { one: string; many: string; name: string }>> = {
  apartment: { one: 'departamento', many: 'departamentos', name: 'Departamento' },
  commercial_space: { one: 'local', many: 'locales', name: 'Local' },
};

export const groupWords = (type: UnitType) =>
  GROUP_WORDS[type] ?? { one: 'unidad', many: 'unidades', name: 'Unidad' };

/** "8 departamentos", "1 local". */
export const groupCount = (type: UnitType, count: number) => {
  const words = groupWords(type);
  return `${count} ${count === 1 ? words.one : words.many}`;
};

/** P-08: nombres que se crearán ("Departamento 101" …), igual que el patrón "{nombre} {n}". */
export const previewNames = (name: string, start: number, quantity: number) =>
  Array.from({ length: quantity }, (_, index) => `${name.trim()} ${start + index}`);

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Nombres de la vista previa que ya existen en la propiedad. */
export const existingNames = (names: string[], units: Pick<Unit, 'name'>[]) =>
  names.filter(name => units.some(unit => sameName(unit.name, name)));

/** P-07: grupos por tipo, en el orden en que aparecen ("Departamento 101 a Departamento 108"). */
export const unitGroups = (units: Pick<Unit, 'name' | 'unit_type'>[]) => {
  const groups: { unit_type: UnitType; names: string[] }[] = [];
  for (const unit of units) {
    const group = groups.find(item => item.unit_type === unit.unit_type);
    if (group) group.names.push(unit.name);
    else groups.push({ unit_type: unit.unit_type, names: [unit.name] });
  }
  return groups.map(({ unit_type, names }) => {
    // Orden natural ("Departamento 9" antes de "Departamento 10"), sin importar cómo llegaron.
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    return {
      unit_type,
      count: sorted.length,
      range: sorted.length === 1 ? sorted[0] : `${sorted[0]} a ${sorted[sorted.length - 1]}`,
    };
  });
};

/**
 * Estado de hoy en P-09. `rented`: marcada Rentada aquí y espera su renta actual (P-10).
 * `pending`: recién creada, sin revisar.
 */
export type UnitSetupState = 'pending' | 'available' | 'maintenance' | 'rented' | 'occupied';

export const unitSetupState = (
  unit: Pick<Unit, 'id' | 'status' | 'reviewed_at'>,
  rentedIds: string[],
): UnitSetupState => {
  if (unit.status === 'occupied') return 'occupied';
  if (rentedIds.includes(unit.id)) return 'rented';
  if (!unit.reviewed_at) return 'pending';
  return unit.status === 'maintenance' ? 'maintenance' : 'available';
};

export const UNIT_SETUP_LABEL: Record<UnitSetupState, string> = {
  pending: 'Por revisar',
  available: 'Disponible',
  maintenance: 'En mantenimiento',
  rented: 'Rentada',
  occupied: 'Rentada',
};

/** Pendientes para P-09 y P-11: sin estado y Rentadas sin su renta actual. */
export const setupPending = (units: Unit[], rentedIds: string[]) => {
  const states = units.map(unit => ({ unit, state: unitSetupState(unit, rentedIds) }));
  return {
    unreviewed: states.filter(item => item.state === 'pending').map(item => item.unit),
    missingRent: states.filter(item => item.state === 'rented').map(item => item.unit),
  };
};

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** "Falta revisar 2 unidades y cargar 1 renta actual." (null si no falta nada). */
export const pendingSentence = ({ unreviewed, missingRent }: ReturnType<typeof setupPending>) => {
  const parts = [
    unreviewed.length > 0
      ? `revisar ${unreviewed.length} ${plural(unreviewed.length, 'unidad', 'unidades')}`
      : '',
    missingRent.length > 0
      ? `cargar ${missingRent.length} ${plural(missingRent.length, 'renta actual', 'rentas actuales')}`
      : '',
  ].filter(Boolean);
  return parts.length > 0 ? `Falta ${parts.join(' y ')}.` : null;
};

/** "Departamento 107 y Departamento 108", "A, B y C". */
export const joinNames = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;

/** Primer paso pendiente al continuar (P-13). Los conteos vienen del backend. */
export const firstPendingStep = (
  property: Pick<Property, 'has_units' | 'configuration_progress'>,
  pending: ReturnType<typeof setupPending>,
): SetupStep => {
  if (!property.has_units) return 'unidades';
  if (
    property.configuration_progress.unreviewed_units > 0 ||
    pending.unreviewed.length > 0 ||
    pending.missingRent.length > 0
  )
    return 'estados';
  return 'revisar';
};

/** "Edificio · Col. Del Valle": tipo y ubicación (colonia), como texto secundario. */
export const setupSubtitle = (
  property: Pick<Property, 'neighborhood' | 'city'>,
  typeTitle: string,
) => [typeTitle, property.neighborhood ?? property.city].filter(Boolean).join(' · ');
