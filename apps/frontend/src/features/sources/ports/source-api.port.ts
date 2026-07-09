import type { Comment, Source } from '../domain/source';

/**
 * Abstrae el acceso a las fuentes (documentos) de un proyecto: listarlas, subirlas,
 * activarlas/desactivarlas y comentarlas. Existe como interfaz separada del adapter
 * porque hoy la implementación es un mock en memoria (`MockSourceApiAdapter`); cuando
 * exista backend real, se agrega un adapter nuevo (fetch a la API, upload multipart,
 * polling o websocket para el estado de procesamiento) que implemente este mismo
 * contrato, sin que los hooks de `application/` ni los componentes deban cambiar.
 */
export interface SourceApiPort {
  list(projectId: string): Promise<Source[]>;

  /**
   * Sube un archivo nuevo. `onStatusChange` es opcional y se invoca cada vez que la
   * fuente avanza de estado (cargado → procesando → procesado), para que la UI pueda
   * reflejar el progreso sin tener que hacer polling manual sobre `list()`.
   */
  upload(projectId: string, file: File, onStatusChange?: (source: Source) => void): Promise<Source>;

  toggleActive(sourceId: string, isActive: boolean): Promise<Source>;

  addComment(sourceId: string, text: string): Promise<Comment>;
}
