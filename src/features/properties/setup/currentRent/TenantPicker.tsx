import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { Tenant } from '@api/tenants';
import { Button, Icon, Notice, SearchField, SectionError, Skeleton } from '@components';
import { TenantForm, toTenantInput } from '@features/tenants/components/TenantForm';
import { buildTenantIndex, searchTenantIds } from '@features/tenants/catalog/tenantSearch';
import { useCreateTenant, useTenantsCatalog } from '@hooks/querys/tenants';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatPhone } from '@lib/format';
import { media } from '@styles/theme';
import { StepIntro, StickyStepFooter } from '../components/stepStyles';

/**
 * En computadora, lista con su propio scroll; en celular crece con la página (un scroll dentro
 * de otro se siente brusco). `position: relative` contiene los radios ocultos (posición
 * absoluta): sin esto quedaban fuera de la lista y alargaban la página con espacio en blanco.
 */
const Results = styled.ul`
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${media.desktop} {
    max-height: 360px;
    overflow-y: auto;
  }
`;

const Option = styled.label<{ $selected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  border: 1px solid
    ${({ $selected, theme }) => ($selected ? theme.color.primary600 : theme.color.neutral200)};
  box-shadow: ${({ $selected, theme }) =>
    $selected ? `inset 0 0 0 1px ${theme.color.primary600}` : 'none'};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : theme.color.white)};
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }

  span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    font-size: 16px;
    overflow-wrap: anywhere;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  svg {
    flex: none;
    color: ${({ theme }) => theme.color.primary600};
  }
`;

const Empty = styled.div`
  padding: 12px 0;

  strong {
    display: block;
    font-size: 16px;
  }

  span {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const NotListed = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const fullName = (tenant: Pick<Tenant, 'first_name' | 'last_name'>) =>
  `${tenant.first_name} ${tenant.last_name}`;

/** Divide lo buscado en nombre y apellidos para prellenar Crear inquilino. */
const nameParts = (term: string) => {
  const words = term
    .trim()
    .split(/\s+/)
    .filter(word => !/\d/.test(word));
  return { first_name: words[0] ?? '', last_name: words.slice(1).join(' ') };
};

type TenantPickerProps = {
  unitName: string;
  selectedId: string | null;
  onSelect: (tenant: Tenant) => void;
  onContinue: () => void;
};

/**
 * P-10 · Inquilino: busca en el catálogo con MiniSearch (nombre, apellidos, alias o teléfono) o
 * crea uno nuevo (T-07) sin perder el avance; al crearlo queda seleccionado.
 */
export function TenantPicker({ unitName, selectedId, onSelect, onContinue }: TenantPickerProps) {
  const catalog = useTenantsCatalog();
  const events = useInvalidateEvents();
  const create = useCreateTenant();
  const [term, setTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const tenants = useMemo(() => catalog.data?.data ?? [], [catalog.data]);
  // Reactor: el índice se rehace cuando cambia el catálogo (también después de invalidarlo).
  const index = useMemo(() => buildTenantIndex(tenants), [tenants]);
  const results = useMemo(() => {
    if (!term.trim()) return tenants;
    const byId = new Map(tenants.map(tenant => [tenant.id, tenant]));
    return searchTenantIds(index, term)
      .map(id => byId.get(id))
      .filter((tenant): tenant is Tenant => Boolean(tenant));
  }, [index, tenants, term]);

  if (creating) {
    return (
      <>
        <StepIntro>
          <h2>Crear inquilino</h2>
          <p>Tu avance sigue aquí.</p>
        </StepIntro>
        <TenantForm
          action="create"
          defaultValues={{ ...nameParts(term), phone: '', alias: '', secondary_phone: '' }}
          submitLabel="Crear inquilino"
          saving={create.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={async values => {
            try {
              const { data } = await create.mutateAsync(toTenantInput(values));
              await events.tenantCreated();
              onSelect(data);
              setCreated(fullName(data));
              setCreating(false);
              setTerm('');
              return undefined;
            } catch (error) {
              return error;
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      <StepIntro>
        <h2>¿Quién renta {unitName}?</h2>
      </StepIntro>
      {created ? (
        <Notice tone="success" title="Inquilino agregado" onClose={() => setCreated(null)}>
          {created} quedó seleccionado para {unitName}.
        </Notice>
      ) : null}
      {missing ? <Notice tone="error" title="Elige quién renta la unidad." /> : null}
      <SearchField
        value={term}
        onChange={setTerm}
        label="Busca al inquilino"
        placeholder="Por nombre o teléfono"
      />
      {catalog.isPending ? (
        <Skeleton $height="160px" />
      ) : catalog.isError ? (
        <SectionError onRetry={() => void catalog.refetch()} retrying={catalog.isFetching} />
      ) : results.length === 0 ? (
        <Empty>
          <strong>
            {term.trim() ? `No encontramos “${term.trim()}”` : 'Aún no tienes inquilinos'}
          </strong>
          <span>{term.trim() ? 'Revisa el nombre o agrégalo ahora.' : 'Agrégalo ahora.'}</span>
        </Empty>
      ) : (
        <Results role="radiogroup" aria-label="Inquilinos">
          {results.map(tenant => (
            <li key={tenant.id}>
              <Option $selected={tenant.id === selectedId}>
                <input
                  type="radio"
                  className="visually-hidden"
                  name="tenant"
                  checked={tenant.id === selectedId}
                  onChange={() => {
                    setMissing(false);
                    onSelect(tenant);
                  }}
                />
                <span>
                  <strong>{fullName(tenant)}</strong>
                  <small>
                    {[formatPhone(tenant.phone), tenant.alias].filter(Boolean).join(' · ')}
                  </small>
                </span>
                {tenant.id === selectedId ? (
                  <Icon name="check" size={20} strokeWidth={2.6} />
                ) : null}
              </Option>
            </li>
          ))}
        </Results>
      )}
      <NotListed>
        ¿No está en la lista?
        <Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>
          Crear inquilino
        </Button>
      </NotListed>
      <StickyStepFooter>
        <Button
          onClick={() => {
            if (!selectedId) {
              setMissing(true);
              return;
            }
            onContinue();
          }}
        >
          Continuar con su contrato
        </Button>
      </StickyStepFooter>
    </>
  );
}
