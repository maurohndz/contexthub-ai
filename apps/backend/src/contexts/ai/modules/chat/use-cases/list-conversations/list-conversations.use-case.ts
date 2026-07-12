import {
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
  type Conversation,
} from '../../domain/chat';
import type { ConversationRepositoryPort } from '../../ports/conversation-repository.port';
import type { OrganizationMembershipPort } from '../../ports/organization-membership.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';

/**
 * Returns the user's conversations in a space, most recently active
 * first. Feeds the chat history shown under each space in the sidebar.
 */
export class ListConversationsUseCase {
  constructor(
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly conversations: ConversationRepositoryPort,
  ) {}

  /**
   * @throws NotOrganizationMemberError when the user is not a member.
   * @throws SpaceNotFoundInOrganizationError when the space belongs to another org.
   */
  async execute(userId: string, organizationId: string, spaceId: string): Promise<Conversation[]> {
    const isMember = await this.membership.isMember(userId, organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(spaceId);
    if (spaceOrganization !== organizationId) throw new SpaceNotFoundInOrganizationError();

    return this.conversations.listBySpaceAndUser(spaceId, userId);
  }
}
