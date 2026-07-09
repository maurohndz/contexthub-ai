import { useEffect } from 'react';
import { create } from 'zustand';
import { mockSourceApiAdapter } from '../infra/mock-source-api.adapter';
import type { Source } from '../domain/source';

interface SourceStoreState {
  sourcesByProject: Record<string, Source[]>;
  loadedProjectIds: Set<string>;
  isLoading: boolean;
  loadSources: (projectId: string) => Promise<void>;
  upsertSource: (projectId: string, source: Source) => void;
}

// Store compartido (no solo local a un componente) porque tanto la subida como el toggle
// y los comentarios necesitan actualizar la misma lista de fuentes desde hooks distintos.
export const useSourceStore = create<SourceStoreState>((set, get) => ({
  sourcesByProject: {},
  loadedProjectIds: new Set(),
  isLoading: false,
  loadSources: async (projectId) => {
    if (get().loadedProjectIds.has(projectId)) return;

    set({ isLoading: true });
    const sources = await mockSourceApiAdapter.list(projectId);

    set((state) => ({
      isLoading: false,
      sourcesByProject: { ...state.sourcesByProject, [projectId]: sources },
      loadedProjectIds: new Set(state.loadedProjectIds).add(projectId),
    }));
  },
  upsertSource: (projectId, source) =>
    set((state) => {
      const current = state.sourcesByProject[projectId] ?? [];
      const exists = current.some((item) => item.id === source.id);
      const next = exists ? current.map((item) => (item.id === source.id ? source : item)) : [...current, source];
      return { sourcesByProject: { ...state.sourcesByProject, [projectId]: next } };
    }),
}));

/** Caso de uso: obtener las fuentes del proyecto activo, disparando la carga inicial desde el adapter mock la primera vez que se pide. */
export function useSources(projectId: string | null) {
  const sourcesByProject = useSourceStore((state) => state.sourcesByProject);
  const isLoading = useSourceStore((state) => state.isLoading);
  const loadSources = useSourceStore((state) => state.loadSources);

  useEffect(() => {
    if (projectId) loadSources(projectId);
  }, [projectId, loadSources]);

  return { sources: projectId ? (sourcesByProject[projectId] ?? []) : [], isLoading };
}
