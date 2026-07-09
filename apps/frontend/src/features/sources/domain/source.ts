/** Estados posibles de una fuente durante su procesamiento, según el flujo definido en el spec funcional. */
export type SourceStatus = 'cargado' | 'procesando' | 'procesado' | 'error';

export type SourceFileType = 'pdf' | 'txt' | 'docx' | 'md' | 'csv' | 'json';

export interface Comment {
  id: string;
  sourceId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Source {
  id: string;
  projectId: string;
  fileName: string;
  fileType: SourceFileType;
  status: SourceStatus;
  isActive: boolean;
  uploadedAt: string;
  comments: Comment[];
}
