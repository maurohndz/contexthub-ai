import type { Source } from '../domain/source';
import { SourceListItem } from './SourceListItem';

interface SourceListProps {
  projectId: string;
  sources: Source[];
}

export function SourceList({ projectId, sources }: SourceListProps) {
  return (
    <div className="flex flex-col gap-2">
      {sources.map((source) => (
        <SourceListItem key={source.id} projectId={projectId} source={source} />
      ))}
    </div>
  );
}
