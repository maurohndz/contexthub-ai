import { useCallback, useState } from 'react';
import { mockSourceApiAdapter } from '../infra/mock-source-api.adapter';
import { useSourceStore } from './use-sources';

/** Caso de uso: subir un archivo nuevo para el proyecto activo y reflejar en la UI cada etapa del pipeline mock (cargado → procesando → procesado) a medida que ocurre. */
export function useUploadSource(projectId: string | null) {
  const upsertSource = useSourceStore((state) => state.upsertSource);
  const [isUploading, setIsUploading] = useState(false);

  const uploadSource = useCallback(
    async (file: File) => {
      if (!projectId) return;

      setIsUploading(true);
      try {
        await mockSourceApiAdapter.upload(projectId, file, (source) => upsertSource(projectId, source));
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, upsertSource],
  );

  return { uploadSource, isUploading };
}
