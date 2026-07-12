import {
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  type Conversation,
} from '../../domain/chat';
import type { ConversationRepositoryPort } from '../../ports/conversation-repository.port';
import type { ChatRealtimeNotifierPort } from '../../ports/realtime-notifier.port';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

/**
 * Starts an empty conversation in a space ("Nuevo chat" button). The
 * title stays null until the first user message; other open tabs of the
 * same user learn about it through the conversation.updated event.
 */
export class CreateConversationUseCase {
  constructor(
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly conversations: ConversationRepositoryPort,
    private readonly notifier: ChatRealtimeNotifierPort,
  ) {}

  /**
   * @throws NotOrganizationMemberError when the user is not a member.
   * @throws SpaceNotFoundInOrganizationError when the space belongs to another org.
   */
  async execute(userId: string, organizationId: string, spaceId: string): Promise<Conversation> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    const conversation = await this.conversations.create(spaceId, userId);
    await this.notifier.notifyConversationUpdated({
      userId,
      organizationId,
      spaceId,
      conversationId: conversation.id,
    });
    return conversation;
  }
}
