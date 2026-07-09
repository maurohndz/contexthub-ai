import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Source } from '../domain/source';
import { useSourceComments } from '../application/use-source-comments';

interface SourceCommentsPanelProps {
  projectId: string;
  source: Source;
}

export function SourceCommentsPanel({ projectId, source }: SourceCommentsPanelProps) {
  const { addComment } = useSourceComments(projectId);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    await addComment(source, text);
    setText('');
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {source.comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavía no hay comentarios sobre esta fuente.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {source.comments.map((comment) => (
            <li key={comment.id} className="rounded-md bg-muted/60 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{comment.author}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Agregar un comentario o corrección…"
          className="min-h-[60px]"
        />
        <Button size="sm" className="self-end" onClick={handleSubmit} disabled={!text.trim() || isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Agregar comentario'}
        </Button>
      </div>
    </div>
  );
}
