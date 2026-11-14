import MiniSearch from 'minisearch';
import type { Tenant } from '@api/tenants';

/**
 * Motor MiniSearch del catálogo de inquilinos (patrón appv2/features/clients): busca lo mismo que
 * el `search` del servidor (nombre, apellidos, alias, teléfonos y la unidad que renta), con
 * prefijos y errores pequeños de escritura. Devuelve IDs; quien lo usa los resuelve.
 */
type TenantDocument = {
  id: string;
  name: string;
  alias: string;
  phones: string;
  /** Unidades y propiedades que renta hoy ("Departamento 101 Torre Centro"). */
  places: string;
};

const digits = (value: string | null) => value?.replace(/\D/g, '') ?? '';

/** Fragmentos de 2 a 4 dígitos para encontrar "5512" dentro de "5512345678". */
const phoneGrams = (phone: string | null) => {
  const all = digits(phone);
  if (!all) return '';
  const grams = new Set([all]);
  for (let size = 2; size <= 4; size += 1)
    for (let index = 0; index <= all.length - size; index += 1)
      grams.add(all.slice(index, index + size));
  return [...grams].join(' ');
};

const toDocument = (tenant: Tenant): TenantDocument => ({
  id: tenant.id,
  name: `${tenant.first_name} ${tenant.last_name}`,
  alias: tenant.alias ?? '',
  phones: [phoneGrams(tenant.phone), phoneGrams(tenant.secondary_phone)].join(' '),
  places: tenant.current_contracts
    .map(contract => `${contract.unit.name} ${contract.unit.property.name}`)
    .join(' '),
});

export const buildTenantIndex = (tenants: Tenant[]) => {
  const index = new MiniSearch<TenantDocument>({
    fields: ['name', 'alias', 'phones', 'places'],
    storeFields: ['id'],
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND' },
  });
  index.addAll(tenants.map(toDocument));
  return index;
};

/** IDs que coinciden; con solo números busca en teléfonos (sin espacios). */
export const searchTenantIds = (index: MiniSearch<TenantDocument>, term: string) => {
  const clean = term.trim().toLowerCase();
  const onlyDigits = /^[\d\s+()-]+$/.test(clean) ? digits(clean) : '';
  const query = onlyDigits.length >= 2 ? onlyDigits : clean;
  if (!query) return [];
  return index.search(query).map(result => String(result.id));
};
