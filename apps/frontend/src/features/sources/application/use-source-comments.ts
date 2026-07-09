import { useCallback } from 'react';
import { mockSourceApiAdapter } from '../infra/mock-source-api.adapter';
import type { Source } from '../domain/source';
import { useSourceStore } from './use-sources';

/** Caso de uso: agregar un comentario o corrección a una fuente puntual y sincronizar el store para que aparezca en la lista sin recargar toda la página. */
export function useSourceComments(projectId: string | null) {
  const upsertSource = useSourceStore((state) => state.upsertSource);

  const addComment = useCallback(
    async (source: Source, text: string) => {
      if (!projectId || !text.trim()) return;
      const comment = await mockSourceApiAdapter.addComment(source.id, text.trim());
      upsertSource(projectId, { ...source, comments: [...source.comments, comment] });
    },
    [projectId, upsertSource],
  );

  return { addComment };
}
