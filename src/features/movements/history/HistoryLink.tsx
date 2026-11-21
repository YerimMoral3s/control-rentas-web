import type { HistorySourceType } from '@api/movements';
import { ActionLink } from '@components';
import { useSourceHistory } from '@hooks/querys/movements';

/**
 * "Ver historial de correcciones" (Y-02, Y-05, E-03, Y-17): solo aparece cuando el pago o gasto
 * tiene correcciones; sin conteo. Lo dice la consulta del historial de ese origen.
 */
export function HistoryLink({ type, id }: { type: HistorySourceType; id: string }) {
  const history = useSourceHistory(type, id).meta?.history;
  if (!history?.has_corrections) return null;
  return (
    <ActionLink to={`/movimientos/historial/${type}/${id}`}>
      Ver historial de correcciones
    </ActionLink>
  );
}
