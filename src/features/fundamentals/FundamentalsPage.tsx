import { useState, type ReactNode } from 'react';
import styled from 'styled-components';
import {
  Button,
  Dialog,
  DialogActions,
  FilterChips,
  MonthSummary,
  Notice,
  OptionGroup,
  PasswordField,
  SearchField,
  Skeleton,
  StateMessage,
  StatusBadge,
  TextField,
  type Status,
} from '@components';
import { useHealth } from '@hooks/querys/health';
import { PageTitle } from '@features/pending/PendingScreen';

/**
 * Galería interna (solo en desarrollo) para comparar los componentes con "00 Fundamentos".
 * Los textos de ejemplo vienen del diseño; no son datos de la API.
 */

const Section = styled.section`
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  line-height: 26px;
  font-weight: 700;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-items: start;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Section aria-labelledby={id}>
      <SectionTitle id={id}>{title}</SectionTitle>
      {children}
    </Section>
  );
}

const STATUSES: Status[] = [
  'paid',
  'pending',
  'overdue',
  'cancelled',
  'active',
  'terminated',
  'available',
  'occupied',
  'maintenance',
];

function HealthStatus() {
  const health = useHealth();

  if (health.isPending) return <Skeleton $height="72px" $radius="14px" />;
  if (health.isError) {
    return (
      <Notice
        tone="error"
        title="No pudimos conectar con la API"
        action={
          <Button variant="secondary" icon="retry" onClick={() => void health.refetch()}>
            Intentar de nuevo
          </Button>
        }
      >
        Revisa que el backend esté encendido y que acepte esta dirección.
      </Notice>
    );
  }
  return (
    <Notice tone="success" title="La API responde">
      Referencia de la consulta: {health.data.meta.request_id}
    </Notice>
  );
}

export function FundamentalsPage() {
  const [search, setSearch] = useState('Torre Centro');
  const [chip, setChip] = useState<'all' | 'overdue' | 'upcoming' | 'rest'>('all');
  const [duration, setDuration] = useState<'6' | '12' | '24'>('12');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <PageTitle>00 Fundamentos</PageTitle>

      <Block id="health" title="Conexión con la API">
        <HealthStatus />
      </Block>

      <Block id="f02" title="F-02 Botones y acciones">
        <Row>
          <Button>Registrar pago</Button>
          <Button loading>Registrar pago</Button>
          <Button disabled>Registrar pago</Button>
        </Row>
        <Row>
          <Button variant="secondary">Limpiar búsqueda</Button>
          <Button variant="neutral">Cancelar</Button>
          <Button variant="tertiary">Ver detalle</Button>
          <Button variant="tertiary" loading loadingLabel="Abriendo…">
            Ver detalle
          </Button>
        </Row>
        <Row>
          <Button variant="danger">Terminar y desocupar</Button>
          <Button variant="dangerTertiary">Eliminar</Button>
          <Button variant="secondary" icon="retry">
            Intentar de nuevo
          </Button>
          <Button variant="tertiary" icon="whatsapp" aria-label="Abrir WhatsApp para María López">
            WhatsApp
          </Button>
        </Row>
      </Block>

      <Block id="f03" title="F-03 Campos y selección">
        <Grid>
          <TextField
            label="Nombre del inquilino"
            placeholder="Ejemplo: María López"
            help="El ejemplo desaparece al escribir."
          />
          <PasswordField />
          <SearchField
            label="Buscar por inquilino, unidad o concepto"
            placeholder="Buscar inquilino, unidad o concepto"
            value={search}
            onChange={setSearch}
          />
          <TextField
            label="Renta mensual"
            prefix="$"
            suffix="MXN"
            inputMode="decimal"
            defaultValue="8,500"
          />
          <TextField label="Fecha de vencimiento" type="date" />
          <OptionGroup
            label="Duración"
            value={duration}
            onChange={setDuration}
            options={[
              { value: '6', label: '6 meses' },
              { value: '12', label: '12 meses' },
              { value: '24', label: '24 meses' },
            ]}
          />
          <TextField
            label="Teléfono del inquilino"
            defaultValue="55 123"
            error="Escribe los 10 dígitos. Ejemplo: 55 1234 5678."
          />
          <TextField
            label="Fecha de inicio"
            readOnly
            defaultValue="1 nov. 2025"
            help="No se puede cambiar en un contrato existente."
          />
        </Grid>
      </Block>

      <Block id="f04" title="F-04 Chips, estados y conteos">
        <FilterChips
          label="Filtrar pagos por atender"
          value={chip}
          onChange={setChip}
          options={[
            { value: 'all', label: 'Todos', count: 12 },
            { value: 'overdue', label: 'Vencidos', count: 3 },
            { value: 'upcoming', label: 'Por vencer', count: 4 },
            { value: 'rest', label: 'Resto del mes', count: 0 },
          ]}
        />
        <Row>
          {STATUSES.map(status => (
            <StatusBadge key={status} status={status} />
          ))}
        </Row>
      </Block>

      <Block id="f06" title="F-06 Resumen mensual plegable">
        <div style={{ maxWidth: 390 }}>
          <MonthSummary
            monthName="octubre"
            expected="120000.00"
            paid="85000.00"
            pending="25000.00"
            overdue="10000.00"
            expenses="18500.00"
            balance="66500.00"
          />
        </div>
      </Block>

      <Block id="f07" title="F-07 Confirmación">
        <Row>
          <Button variant="danger" onClick={() => setDialogOpen(true)}>
            Terminar y desocupar
          </Button>
        </Row>
        <Dialog open={dialogOpen} title="Terminar y desocupar" onClose={() => setDialogOpen(false)}>
          <p style={{ margin: 0 }}>
            El contrato quedará Terminado y la unidad Disponible. Se conservan los pagos atrasados,
            el historial, el inquilino y el depósito.
          </p>
          <DialogActions>
            <Button variant="danger" onClick={() => setDialogOpen(false)}>
              Terminar y desocupar
            </Button>
            <Button variant="neutral" data-initial-focus onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      </Block>

      <Block id="f08" title="F-08 Resultado, vacío, error y carga">
        <Grid>
          <Notice tone="success" title="Pago registrado" onClose={() => undefined}>
            María López · Renta octubre · $8,500. Ya no aparece en Pagos por atender.
          </Notice>
          <Notice
            tone="uncertain"
            title="No pudimos confirmar si se guardó"
            requestId="req_front_payments_register_ejemplo"
            action={<Button variant="secondary">Revisar cobro</Button>}
          >
            Revisa el cobro antes de intentarlo otra vez.
          </Notice>
          <StateMessage
            kind="error"
            title="No pudimos cargar esta sección"
            description="El resto de la pantalla sigue disponible."
            action={
              <Button variant="secondary" icon="retry">
                Intentar de nuevo
              </Button>
            }
          />
          <StateMessage
            kind="empty"
            title="Aún no hay movimientos registrados"
            description="Aquí verás los pagos y gastos que registres."
            action={<Button>Registrar primer gasto</Button>}
          />
          <div aria-busy="true" aria-label="Cargando cobros" style={{ display: 'grid', gap: 12 }}>
            <Skeleton $height="16px" $width="70%" />
            <Skeleton $height="14px" $width="50%" />
            <Skeleton $height="28px" $width="110px" $radius="999px" />
            <Skeleton $height="48px" $radius="10px" />
          </div>
        </Grid>
      </Block>
    </>
  );
}
