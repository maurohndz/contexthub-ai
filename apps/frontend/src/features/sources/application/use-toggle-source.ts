import { useCallback } from 'react';
import { mockSourceApiAdapter } from '../infra/mock-source-api.adapter';
import type { Source } from '../domain/source';
import { useSourceStore } from './use-sources';

/** Caso de uso: activar o desactivar una fuente existente. Una fuente inactiva queda excluida de futuras búsquedas (regla de negocio del spec); hoy solo cambia el estado visual porque no hay motor de búsqueda real todavía. */
export function useToggleSource(projectId: string | null) {
  const upsertSource = useSourceStore((state) => state.upsertSource);

  const toggleSource = useCallback(
    async (source: Source) => {
      if (!projectId) return;
      const updated = await mockSourceApiAdapter.toggleActive(source.id, !source.isActive);
      upsertSource(projectId, updated);
    },
    [projectId, upsertSource],
  );

  return { toggleSource };
}
