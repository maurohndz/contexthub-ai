import { mockSources } from '@/lib/mock-data/sources.mock';
import type { Comment, Source, SourceFileType } from '../domain/source';
import type { SourceApiPort } from '../ports/source-api.port';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Estado compartido en memoria entre todas las llamadas al adapter durante la sesión del navegador
// (no persiste al recargar la página, es solo para poder maquetar el flujo sin backend).
const sources: Source[] = [...mockSources];

function inferFileType(fileName: string): SourceFileType {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
    case 'docx':
    case 'md':
    case 'csv':
    case 'json':
      return extension;
    default:
      return 'txt';
  }
}

class MockSourceApiAdapter implements SourceApiPort {
  async list(projectId: string): Promise<Source[]> {
    await delay(300);
    // Copiamos cada fuente (incluido el array de comments) para que el store de la UI no
    // comparta referencia con el estado interno del adapter: si compartiera referencia,
    // las mutaciones de addComment/upload se reflejarían dos veces (una por la mutación
    // directa y otra por el merge explícito que hacen los hooks).
    return sources.filter((source) => source.projectId === projectId).map((source) => ({ ...source, comments: [...source.comments] }));
  }

  // Simula el pipeline de procesamiento real (módulo 7 del spec funcional): extracción de
  // texto → fragmentado → generación de embeddings. Como no hay backend, avanzamos el
  // estado localmente con timeouts y notificamos por callback en cada paso, así la UI
  // puede mostrar la transición cargado → procesando → procesado en tiempo real.
  async upload(projectId: string, file: File, onStatusChange?: (source: Source) => void): Promise<Source> {
    const source: Source = {
      id: `src-${Date.now()}`,
      projectId,
      fileName: file.name,
      fileType: inferFileType(file.name),
      status: 'cargado',
      isActive: true,
      uploadedAt: new Date().toISOString(),
      comments: [],
    };
    sources.push(source);
    onStatusChange?.({ ...source });

    await delay(800);
    source.status = 'procesando';
    onStatusChange?.({ ...source });

    await delay(1200);
    source.status = 'procesado';
    onStatusChange?.({ ...source });

    return { ...source };
  }

  async toggleActive(sourceId: string, isActive: boolean): Promise<Source> {
    await delay(300);
    const source = sources.find((item) => item.id === sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);
    source.isActive = isActive;
    return { ...source };
  }

  async addComment(sourceId: string, text: string): Promise<Comment> {
    await delay(300);
    const source = sources.find((item) => item.id === sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      sourceId,
      // Hardcodeado porque todavía no hay sesión/usuario real; se reemplaza cuando exista auth.
      author: 'Vos',
      text,
      createdAt: new Date().toISOString(),
    };
    source.comments.push(comment);
    return comment;
  }
}

export const mockSourceApiAdapter = new MockSourceApiAdapter();
