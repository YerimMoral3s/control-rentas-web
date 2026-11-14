import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { ReturnLink } from '@components';
import { useCreateTenant } from '@hooks/querys/tenants';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { withResult } from '@lib/useResultNotice';
import { TenantForm, toTenantInput } from './components/TenantForm';
import { pageTitle } from '@styles/theme';

export const FormPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  h1 {
    margin: 0;
    ${pageTitle}
  }
`;

const EMPTY = { first_name: '', last_name: '', phone: '', alias: '', secondary_phone: '' };

/** T-06: Crear inquilino desde Inquilinos. Al guardar abre su detalle con el resultado. */
export function TenantCreatePage() {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const create = useCreateTenant();

  return (
    <FormPage>
      <ReturnLink to="/inquilinos" label="Inquilinos" />
      <h1>Crear inquilino</h1>
      <TenantForm
        action="create"
        defaultValues={EMPTY}
        submitLabel="Crear inquilino"
        saving={create.isPending}
        onCancel={() => void navigate(-1)}
        onSubmit={async values => {
          try {
            const { data } = await create.mutateAsync(toTenantInput(values));
            await events.tenantCreated();
            void navigate(`/inquilinos/${data.id}`, {
              replace: true,
              state: withResult({
                title: 'Inquilino agregado.',
                body: 'Desde aquí puedes crear su contrato.',
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
