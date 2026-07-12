/** Emitted when a user's conversation is created, renamed or gets messages. */
export interface ConversationUpdatedEvent {
  /** Owner of the conversation: the only user that receives the event. */
  userId: string;
  organizationId: string;
  spaceId: string;
  conversationId: string;
}

/**
 * Invalidation signal towards the frontend (SSE): tells WHEN to re-fetch;
 * it never carries the data. Conversations are private, so infra publishes
 * only to the owning user (all of their tabs/devices).
 */
export interface ChatRealtimeNotifierPort {
  notifyConversationUpdated(event: ConversationUpdatedEvent): Promise<void>;
}
