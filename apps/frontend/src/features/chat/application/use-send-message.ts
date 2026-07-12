import { useCallback } from 'react';
import type { ChatMode } from '../domain/mode';
import { useChatStore } from './use-conversation';

/**
 * Sends a question into the active conversation of the project (creating
 * one on the fly when none is active) and appends the assistant reply —
 * or a local error message — to the thread.
 */
export function useSendMessage(organizationId: string | null, projectId: string | null) {
  const isSending = useChatStore((state) => state.isSending);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode, model: string | null) => {
      if (!organizationId || !projectId || !content.trim()) return;
      await useChatStore
        .getState()
        .sendMessage(organizationId, projectId, content.trim(), mode, model);
    },
    [organizationId, projectId],
  );

  return { sendMessage, isSending };
}
