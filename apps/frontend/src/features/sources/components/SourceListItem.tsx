import { useState } from 'react';
import { FileJson, FileSpreadsheet, FileText, MessageSquare } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Source, SourceFileType, SourceStatus } from '../domain/source';
import { useToggleSource } from '../application/use-toggle-source';
import { SourceCommentsPanel } from './SourceCommentsPanel';

const FILE_ICONS: Record<SourceFileType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
  csv: FileSpreadsheet,
  json: FileJson,
};

const STATUS_LABEL: Record<SourceStatus, string> = {
  cargado: 'Cargado',
  procesando: 'Procesando',
  procesado: 'Procesado',
  error: 'Error',
};

// Mapeo semántico: verde = éxito, acento = en curso, rojo = error, gris = estado inicial neutro.
const STATUS_VARIANT: Record<SourceStatus, BadgeProps['variant']> = {
  cargado: 'muted',
  procesando: 'info',
  procesado: 'success',
  error: 'destructive',
};

interface SourceListItemProps {
  projectId: string;
  source: Source;
}

export function SourceListItem({ projectId, source }: SourceListItemProps) {
  const { toggleSource } = useToggleSource(projectId);
  const [showComments, setShowComments] = useState(false);
  const Icon = FILE_ICONS[source.fileType];

  // Una fuente que todavía no terminó de procesarse o que falló no puede activarse: no hay nada útil que buscar en ella todavía.
  const isToggleDisabled = source.status === 'procesando' || source.status === 'error';

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{source.fileName}</p>
          <p className="text-xs text-muted-foreground">{new Date(source.uploadedAt).toLocaleDateString('es-AR')}</p>
        </div>
        <Badge variant={STATUS_VARIANT[source.status]}>{STATUS_LABEL[source.status]}</Badge>
        <Switch checked={source.isActive} onCheckedChange={() => toggleSource(source)} disabled={isToggleDisabled} />
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setShowComments((prev) => !prev)}
        >
          <MessageSquare className="h-4 w-4" />
          {source.comments.length > 0 && source.comments.length}
        </Button>
      </div>

      {showComments && (
        <div className="border-t px-4 py-3">
          <SourceCommentsPanel projectId={projectId} source={source} />
        </div>
      )}
    </div>
  );
}
