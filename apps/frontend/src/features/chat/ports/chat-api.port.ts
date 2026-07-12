import type { ChatMode } from '../domain/mode';
import type { Conversation } from '../domain/conversation';
import type { Message } from '../domain/message';

/** API client contract for the chat feature. */
export interface ChatApiPort {
  /** The user's conversations in the space, most recently active first. */
  listConversations(organizationId: string, spaceId: string): Promise<Conversation[]>;
  /** Starts an empty conversation ("Nuevo chat"). */
  createConversation(organizationId: string, spaceId: string): Promise<Conversation>;
  getMessages(organizationId: string, spaceId: string, conversationId: string): Promise<Message[]>;
  // model: AI model chosen in the ModelSelector (null when the
  // organization has not configured any provider yet).
  sendMessage(
    organizationId: string,
    spaceId: string,
    conversationId: string,
    content: string,
    mode: ChatMode,
    model: string | null,
  ): Promise<Message>;
}
