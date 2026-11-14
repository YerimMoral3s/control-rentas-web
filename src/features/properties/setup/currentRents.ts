import type { ContractSummary } from '@api/contracts';
import { useContracts } from '@hooks/querys/contracts';
import { QueryPageSize } from '@hooks/querys/queryBase';
import { formatMoney } from '@lib/format';

/** Rentas actuales de la propiedad por unidad (P-09 y P-11), con los datos del servidor. */
export const useCurrentRents = (propertyId: string) => {
  const query = useContracts(
    { property_id: propertyId, is_current: true },
    true,
    QueryPageSize.max,
  );
  return new Map(query.items.map(contract => [contract.unit.id, contract]));
};

/** "Raúl Herrera · Contrato Activo · $8,800 al mes" o "… · Contrato Vencido · sigue rentando". */
export const currentRentLine = (contract: ContractSummary | undefined) => {
  if (!contract) return 'Ya tiene su renta actual.';
  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;
  return contract.status === 'expired'
    ? `${name} · Contrato Vencido · sigue rentando`
    : `${name} · Contrato Activo · ${formatMoney(contract.rent_amount)} al mes`;
};
