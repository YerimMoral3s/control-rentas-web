import { SectionError as BaseSectionError } from '@components';

/** H-12 con el texto de Inicio. */
export function SectionError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <BaseSectionError
      onRetry={onRetry}
      retrying={retrying}
      description="El resto de Inicio sigue disponible."
    />
  );
}
