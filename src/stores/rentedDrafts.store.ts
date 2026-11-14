import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type RentedDraftsState = {
  /** Unidades marcadas como Rentada en P-09 que aún esperan su renta actual (P-10). */
  unitIds: string[];
  mark: (unitId: string) => void;
  unmark: (unitId: string) => void;
  reset: () => void;
};

/**
 * Marca local de "Rentada" durante la configuración: el backend solo acepta Rentada cuando ya
 * existe su contrato (se carga en P-10). Vive en sessionStorage de la pestaña, como la sesión, y
 * se borra al salir o al cambiar de cuenta (`clearSessionData`). No guarda datos personales.
 */
export const useRentedDrafts = create<RentedDraftsState>()(
  persist(
    set => ({
      unitIds: [],
      mark: unitId =>
        set(state =>
          state.unitIds.includes(unitId) ? state : { unitIds: [...state.unitIds, unitId] },
        ),
      unmark: unitId => set(state => ({ unitIds: state.unitIds.filter(id => id !== unitId) })),
      reset: () => set({ unitIds: [] }),
    }),
    { name: 'rentario-rented-drafts', storage: createJSONStorage(() => sessionStorage) },
  ),
);
