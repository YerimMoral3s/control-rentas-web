import { Button } from '../Button';
import { StateMessage } from '../StateMessage';

type SectionErrorProps = {
  onRetry: () => void;
  retrying: boolean;
  /** Qué sigue disponible, por ejemplo "El resto de Inicio sigue disponible." */
  description?: string;
};

/** S-06 / H-12: si un bloque falla, el resto de la pantalla sigue disponible. */
export function SectionError({
  onRetry,
  retrying,
  description = 'El resto de la página sigue disponible.',
}: SectionErrorProps) {
  return (
    <StateMessage
      kind="error"
      title="No pudimos cargar esta sección"
      description={description}
      action={
        <Button
          variant="secondary"
          icon="retry"
          loading={retrying}
          loadingLabel="Cargando…"
          onClick={onRetry}
        >
          Intentar de nuevo
        </Button>
      }
    />
  );
}
