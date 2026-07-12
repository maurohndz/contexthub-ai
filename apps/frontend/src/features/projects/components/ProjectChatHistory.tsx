import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversationList } from '@/features/chat/application/use-conversation';
import { cn } from '@/lib/utils';

interface ProjectChatHistoryProps {
  organizationId: string;
  projectId: string;
}

/**
 * Chat history shown under the active project in the sidebar: the user's
 * conversations in that space (active one highlighted) plus a button to
 * start a new chat. The list stays fresh via conversation.updated SSE
 * events (see the chat store).
 */
export function ProjectChatHistory({ organizationId, projectId }: ProjectChatHistoryProps) {
  const { conversations, activeConversationId, isLoading, selectConversation, startNewConversation } =
    useConversationList(organizationId, projectId);

  return (
    <div className="ml-4 flex flex-col gap-0.5 border-l pb-1 pl-2 pr-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 justify-start gap-1.5 px-2 text-xs text-muted-foreground"
        onClick={startNewConversation}
      >
        <Plus className="h-3.5 w-3.5" />
        Nuevo chat
      </Button>

      {isLoading && conversations.length === 0 && (
        <p className="px-2 py-1 text-xs text-muted-foreground">Cargando chats…</p>
      )}

      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          onClick={() => selectConversation(conversation.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
            conversation.id === activeConversationId
              ? 'bg-accent font-medium text-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )}
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{conversation.title ?? 'Nuevo chat'}</span>
        </button>
      ))}
    </div>
  );
}
