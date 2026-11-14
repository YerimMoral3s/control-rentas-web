import { useNavigate, useParams } from 'react-router';
import type { TenantInput } from '@api/tenants';
import { ReturnLink, SectionError, Skeleton, StateMessage } from '@components';
import { useTenant, useUpdateTenant } from '@hooks/querys/tenants';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatPhone } from '@lib/format';
import { withResult } from '@lib/useResultNotice';
import { theme as tokens } from '@styles/theme';
import { TenantForm, toTenantInput } from './components/TenantForm';
import { FormPage } from './TenantCreatePage';
import { fullName } from './tenantText';

/** Solo los campos que cambiaron: el backend pide al menos uno y valida con los valores finales. */
const changedFields = (before: TenantInput, after: TenantInput) =>
  (Object.keys(after) as Array<keyof TenantInput>).reduce<Partial<TenantInput>>((changes, key) => {
    if (after[key] !== before[key]) return { ...changes, [key]: after[key] };
    return changes;
  }, {});

/** T-08: Editar inquilino. Sin confirmación extra: no cambia dinero ni unidades. */
export function TenantEditPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const query = useTenant(tenantId);
  const update = useUpdateTenant();
  const back = <ReturnLink to={`/inquilinos/${tenantId ?? ''}`} label="Volver" />;

  if (query.isPending) {
    return (
      <FormPage aria-busy="true">
        {back}
        <Skeleton $height="320px" $radius={tokens.radius.panel} />
      </FormPage>
    );
  }
  if (query.isError) {
    return (
      <FormPage>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage kind="empty" title="No encontramos a este inquilino" />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </FormPage>
    );
  }

  const tenant = query.data.data;
  const original: TenantInput = {
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    phone: tenant.phone,
    alias: tenant.alias,
    secondary_phone: tenant.secondary_phone,
  };

  return (
    <FormPage>
      {back}
      <div>
        <h1>Editar inquilino</h1>
        <span>{fullName(tenant)}</span>
      </div>
      <TenantForm
        action="update"
        defaultValues={{
          first_name: tenant.first_name,
          last_name: tenant.last_name,
          phone: formatPhone(tenant.phone),
          alias: tenant.alias ?? '',
          secondary_phone: tenant.secondary_phone ? formatPhone(tenant.secondary_phone) : '',
        }}
        submitLabel="Guardar cambios"
        saving={update.isPending}
        onCancel={() => void navigate(-1)}
        onSubmit={async values => {
          const changes = changedFields(original, toTenantInput(values));
          if (Object.keys(changes).length === 0) {
            void navigate(-1);
            return undefined;
          }
          try {
            await update.mutateAsync({ tenantId: tenant.id, changes });
            await events.tenantUpdated(tenant.id);
            void navigate(`/inquilinos/${tenant.id}`, {
              replace: true,
              state: withResult({
                title: 'Cambios guardados.',
                body: 'phone' in changes ? 'WhatsApp usará el nuevo teléfono.' : undefined,
              }),
            });
            return undefined;
          } catch (error) {
            return error;
          }
        }}
      />
    </FormPage>
  );
}
