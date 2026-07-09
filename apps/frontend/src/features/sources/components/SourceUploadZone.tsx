import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUploadSource } from '../application/use-upload-source';

interface SourceUploadZoneProps {
  projectId: string;
}

export function SourceUploadZone({ projectId }: SourceUploadZoneProps) {
  const { uploadSource, isUploading } = useUploadSource(projectId);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) uploadSource(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors',
        isDraggingOver ? 'border-primary bg-accent/60' : 'border-border',
      )}
    >
      <UploadCloud className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-foreground">Arrastrá un archivo acá o subilo manualmente</p>
      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, CSV o JSON</p>
      <Button size="sm" className="mt-1" onClick={() => inputRef.current?.click()} disabled={isUploading}>
        {isUploading ? 'Subiendo…' : 'Subir fuente'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          // Se limpia el valor para poder volver a subir el mismo archivo dos veces seguidas.
          event.target.value = '';
        }}
      />
    </div>
  );
}
