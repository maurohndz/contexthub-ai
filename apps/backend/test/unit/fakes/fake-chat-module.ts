import type {
  ChatMessage,
  ChatRole,
  Conversation,
} from '../../../src/contexts/ai/modules/chat/domain/chat';
import type {
  AppendMessageData,
  ConversationRepositoryPort,
} from '../../../src/contexts/ai/modules/chat/ports/conversation-repository.port';
import type {
  ChatRealtimeNotifierPort,
  ConversationUpdatedEvent,
} from '../../../src/contexts/ai/modules/chat/ports/realtime-notifier.port';

/** In-memory membership check keyed as `${userId}:${organizationId}`. */
export class FakeChatMembership {
  members = new Set<string>();
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    return this.members.has(`${userId}:${organizationId}`);
  }
}

/** In-memory space → organization lookup. */
export class FakeChatSpaceAccess {
  spaces = new Map<string, string>(); // spaceId -> organizationId
  async findSpaceOrganization(spaceId: string): Promise<string | null> {
    return this.spaces.get(spaceId) ?? null;
  }
}

/** In-memory conversations/messages store mirroring the Prisma repository. */
export class FakeConversationRepository implements ConversationRepositoryPort {
  conversations: Array<Conversation & { userId: string }> = [];
  messages: Array<AppendMessageData & { id: string; createdAt: Date }> = [];
  private conversationCounter = 0;
  private messageCounter = 0;

  async create(spaceId: string, userId: string): Promise<Conversation> {
    this.conversationCounter += 1;
    const now = new Date();
    const conversation = {
      id: `conv-${this.conversationCounter}`,
      spaceId,
      userId,
      title: null,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.push(conversation);
    return conversation;
  }

  async listBySpaceAndUser(spaceId: string, userId: string): Promise<Conversation[]> {
    return this.conversations
      .filter((c) => c.spaceId === spaceId && c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findOwned(
    conversationId: string,
    spaceId: string,
    userId: string,
  ): Promise<Conversation | null> {
    return (
      this.conversations.find(
        (c) => c.id === conversationId && c.spaceId === spaceId && c.userId === userId,
      ) ?? null
    );
  }

  async setTitle(conversationId: string, title: string): Promise<void> {
    const conversation = this.conversations.find((c) => c.id === conversationId);
    if (conversation) conversation.title = title;
  }

  async appendMessage(data: AppendMessageData): Promise<ChatMessage> {
    this.messageCounter += 1;
    const stored = { ...data, id: `msg-${this.messageCounter}`, createdAt: new Date() };
    this.messages.push(stored);
    const conversation = this.conversations.find((c) => c.id === data.conversationId);
    if (conversation) conversation.updatedAt = stored.createdAt;
    return {
      id: stored.id,
      role: stored.role as ChatRole,
      content: stored.content,
      createdAt: stored.createdAt,
    };
  }

  async listMessages(conversationId: string, limit = 50): Promise<ChatMessage[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .slice(-limit)
      .map((message) => ({
        id: message.id,
        role: message.role as ChatRole,
        content: message.content,
        createdAt: message.createdAt,
      }));
  }
}

/** Records published conversation.updated events for assertions. */
export class FakeChatRealtimeNotifier implements ChatRealtimeNotifierPort {
  events: ConversationUpdatedEvent[] = [];
  async notifyConversationUpdated(event: ConversationUpdatedEvent): Promise<void> {
    this.events.push(event);
  }
}
