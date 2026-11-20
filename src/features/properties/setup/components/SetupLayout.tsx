import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import type { Property } from '@api/properties';
import { ActionMenu, Button, Icon } from '@components';
import { DeletePropertyDialog } from '@features/properties/components/DeletePropertyDialog';
import { media, pageTitle } from '@styles/theme';
import { SETUP_STEPS, type SetupStep } from '../setupText';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  ${media.desktop} {
    gap: 24px;
  }
`;

const Head = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h1 {
    margin: 0;
    ${pageTitle}
  }

  p {
    margin: 0;
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

/** Celular: Atrás / Cancelar a la izquierda y Guardar y salir a la derecha (P-06 a P-11). */
const MobileBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: -8px 0 0 -10px;

  ${media.desktop} {
    display: none;
  }
`;

const MobileEnd = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MobileStep = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.primary700};

  span {
    font-weight: 400;
    color: ${({ theme }) => theme.color.neutral600};
  }

  ${media.desktop} {
    display: none;
  }
`;

const Columns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  ${media.desktop} {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    align-items: start;
    gap: 32px;
  }
`;

/** Computadora: barra de pasos a la izquierda con Guardar y salir (P-05 a P-11). */
const Steps = styled.nav`
  display: none;

  ${media.desktop} {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: ${({ theme }) => theme.color.white};
    border: 1px solid ${({ theme }) => theme.color.neutral200};
    border-radius: ${({ theme }) => theme.radius.panel};
  }

  h2 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral600};
  }

  ol {
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

const StepItem = styled.li<{ $current: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $current, theme }) => ($current ? theme.color.primary50 : 'transparent')};

  strong {
    display: block;
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral950};
  }

  small {
    font-size: 13px;
    color: ${({ $current, theme }) => ($current ? theme.color.primary700 : theme.color.neutral600)};
  }

  a {
    color: ${({ theme }) => theme.color.primary600};
    font-weight: 600;
  }
`;

const Mark = styled.span<{ $done: boolean; $current: boolean }>`
  flex: none;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: ${({ $done, $current, theme }) =>
    $done || $current ? theme.color.primary600 : theme.color.neutral100};
  color: ${({ $done, $current, theme }) =>
    $done || $current ? theme.color.white : theme.color.neutral600};
`;

type SetupLayoutProps<K extends string> = {
  step: NoInfer<K>;
  /** Pasos del recorrido; por defecto, los 4 de configurar una propiedad. */
  steps?: ReadonlyArray<{ key: K; label: string }>;
  /** Pasos ya terminados (se pueden consultar con "Ver"). */
  done: Partial<Record<NoInfer<K>, boolean>>;
  /** Ruta de cada paso; sin ruta (alta nueva) el paso no se puede abrir todavía. */
  stepTo?: (step: NoInfer<K>) => string;
  title: string;
  subtitle?: string;
  back: { label: string; onClick: () => void };
  /** Sin propiedad creada aún (P-05) la salida es Cancelar y no hay Guardar y salir. */
  onSaveExit?: () => void;
  saving?: boolean;
  /** Ya creada: se puede eliminar desde cualquier paso (pedido del usuario, 13 nov.). */
  property?: Property;
  children: ReactNode;
};

/** Marco de un recorrido por pasos (configurar propiedad, crear contrato): pasos, título y salida segura. */
export function SetupLayout<K extends string = SetupStep>({
  step,
  steps = SETUP_STEPS as unknown as ReadonlyArray<{ key: K; label: string }>,
  done,
  stepTo,
  title,
  subtitle,
  back,
  onSaveExit,
  saving,
  property,
  children,
}: SetupLayoutProps<K>) {
  const [deleting, setDeleting] = useState(false);
  const index = steps.findIndex(item => item.key === step);
  const saveExit = onSaveExit ? (
    <Button variant="tertiary" onClick={onSaveExit} loading={saving} loadingLabel="Guardando…">
      Guardar y salir
    </Button>
  ) : null;

  return (
    <Page>
      <MobileBar>
        <Button variant="tertiary" onClick={back.onClick} disabled={saving}>
          <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
          {back.label}
        </Button>
        <MobileEnd>
          {saveExit}
          {property ? (
            <ActionMenu
              items={[
                { label: 'Eliminar propiedad', danger: true, onSelect: () => setDeleting(true) },
              ]}
            />
          ) : null}
        </MobileEnd>
      </MobileBar>
      <MobileStep>
        Paso {index + 1} de {steps.length} <span>· {steps[index]?.label}</span>
      </MobileStep>
      <Head>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </Head>
      <Columns>
        <Steps aria-label="Pasos de la configuración">
          <h2>Pasos</h2>
          <ol>
            {steps.map((item, position) => {
              const current = item.key === step;
              const isDone = Boolean(done[item.key]) && !current;
              return (
                <StepItem
                  key={item.key}
                  $current={current}
                  aria-current={current ? 'step' : undefined}
                >
                  <Mark $done={isDone} $current={current} aria-hidden="true">
                    {isDone ? <Icon name="check" size={16} strokeWidth={2.6} /> : position + 1}
                  </Mark>
                  <span>
                    <strong>{item.label}</strong>
                    <small>
                      {current ? (
                        'En curso'
                      ) : isDone && stepTo ? (
                        <>
                          Terminado · <Link to={stepTo(item.key)}>Ver</Link>
                        </>
                      ) : isDone ? (
                        'Terminado'
                      ) : (
                        'Pendiente'
                      )}
                    </small>
                  </span>
                </StepItem>
              );
            })}
          </ol>
          {saveExit ?? (
            <Button variant="tertiary" onClick={back.onClick}>
              {back.label}
            </Button>
          )}
          {property ? (
            <Button variant="dangerTertiary" onClick={() => setDeleting(true)} disabled={saving}>
              Eliminar propiedad
            </Button>
          ) : null}
        </Steps>
        <div>{children}</div>
      </Columns>
      {property ? (
        <DeletePropertyDialog
          property={property}
          open={deleting}
          onClose={() => setDeleting(false)}
        />
      ) : null}
    </Page>
  );
}
