import type { Source } from '@/features/sources/domain/source';

export const mockSources: Source[] = [
  {
    id: 'src-1',
    projectId: 'proj-1',
    fileName: 'manual_facturacion.pdf',
    fileType: 'pdf',
    status: 'procesado',
    isActive: true,
    uploadedAt: '2026-07-01T09:00:00.000Z',
    comments: [
      {
        id: 'cmt-1',
        sourceId: 'src-1',
        author: 'Mauro Hernandez',
        text: 'La sección 4.2 quedó desactualizada respecto a la versión 3 del manual, falta revisarla.',
        createdAt: '2026-07-02T11:15:00.000Z',
      },
    ],
  },
  {
    id: 'src-2',
    projectId: 'proj-1',
    fileName: 'reglas_descuentos.docx',
    fileType: 'docx',
    status: 'procesado',
    isActive: true,
    uploadedAt: '2026-07-03T14:20:00.000Z',
    comments: [],
  },
  {
    id: 'src-3',
    projectId: 'proj-1',
    fileName: 'transcripcion_reunion_cliente.txt',
    fileType: 'txt',
    status: 'procesando',
    isActive: true,
    uploadedAt: '2026-07-06T16:45:00.000Z',
    comments: [],
  },
  {
    id: 'src-4',
    projectId: 'proj-2',
    fileName: 'tickets_soporte.csv',
    fileType: 'csv',
    status: 'error',
    isActive: false,
    uploadedAt: '2026-07-07T10:05:00.000Z',
    comments: [],
  },
];
