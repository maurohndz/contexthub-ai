import { publishToUser } from '../../../../../infrastructure/realtime/redis-event-bus';
import type {
  ChatRealtimeNotifierPort,
  ConversationUpdatedEvent,
} from '../ports/realtime-notifier.port';

/**
 * Publishes conversation invalidation signals to the owning user only
 * (conversations are private, unlike documents which fan out to the org).
 */
export class RedisChatRealtimeNotifierAdapter implements ChatRealtimeNotifierPort {
  async notifyConversationUpdated(event: ConversationUpdatedEvent): Promise<void> {
    const { userId, ...payload } = event;
    await publishToUser(userId, { type: 'conversation.updated' as const, ...payload });
  }
}
