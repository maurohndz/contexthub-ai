import { describe, expect, it } from 'vitest';
import {
  ConversationNotFoundError,
  NotOrganizationMemberError,
  SpaceNotFoundInOrganizationError,
} from '../../src/contexts/ai/modules/chat/domain/chat';
import { CreateConversationUseCase } from '../../src/contexts/ai/modules/chat/use-cases/create-conversation/create-conversation.use-case';
import { GetChatHistoryUseCase } from '../../src/contexts/ai/modules/chat/use-cases/get-chat-history/get-chat-history.use-case';
import { ListConversationsUseCase } from '../../src/contexts/ai/modules/chat/use-cases/list-conversations/list-conversations.use-case';
import {
  FakeChatMembership,
  FakeChatRealtimeNotifier,
  FakeChatSpaceAccess,
  FakeConversationRepository,
} from './fakes/fake-chat-module';

function setup() {
  const membership = new FakeChatMembership();
  const spaceAccess = new FakeChatSpaceAccess();
  const conversations = new FakeConversationRepository();
  const notifier = new FakeChatRealtimeNotifier();

  membership.members.add('user-1:org-1');
  spaceAccess.spaces.set('space-1', 'org-1');

  return {
    membership,
    spaceAccess,
    conversations,
    notifier,
    listConversations: new ListConversationsUseCase(membership, spaceAccess, conversations),
    createConversation: new CreateConversationUseCase(
      membership,
      spaceAccess,
      conversations,
      notifier,
    ),
    getChatHistory: new GetChatHistoryUseCase(membership, spaceAccess, conversations),
  };
}

describe('ListConversationsUseCase', () => {
  it("returns only the user's conversations in the space, most recent first", async () => {
    const { listConversations, conversations } = setup();
    const first = await conversations.create('space-1', 'user-1');
    const second = await conversations.create('space-1', 'user-1');
    await conversations.create('space-1', 'user-2'); // another user's thread
    await conversations.create('space-2', 'user-1'); // another space

    // Activity on the first thread moves it back to the top.
    await conversations.appendMessage({
      conversationId: first.id,
      role: 'user',
      content: 'hola',
    });

    const result = await listConversations.execute('user-1', 'org-1', 'space-1');

    expect(result.map((c) => c.id)).toEqual([first.id, second.id]);
  });

  it('rejects a non-member and a space from another organization', async () => {
    const { listConversations, spaceAccess } = setup();

    await expect(listConversations.execute('intruso', 'org-1', 'space-1')).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );

    spaceAccess.spaces.set('space-1', 'org-OTRA');
    await expect(listConversations.execute('user-1', 'org-1', 'space-1')).rejects.toBeInstanceOf(
      SpaceNotFoundInOrganizationError,
    );
  });
});

describe('CreateConversationUseCase', () => {
  it('creates an untitled conversation and notifies the owner', async () => {
    const { createConversation, conversations, notifier } = setup();

    const conversation = await createConversation.execute('user-1', 'org-1', 'space-1');

    expect(conversation.title).toBeNull();
    expect(conversations.conversations).toHaveLength(1);
    expect(notifier.events).toEqual([
      {
        userId: 'user-1',
        organizationId: 'org-1',
        spaceId: 'space-1',
        conversationId: conversation.id,
      },
    ]);
  });

  it('rejects a non-member and a space from another organization', async () => {
    const { createConversation, spaceAccess, notifier } = setup();

    await expect(createConversation.execute('intruso', 'org-1', 'space-1')).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );

    spaceAccess.spaces.set('space-1', 'org-OTRA');
    await expect(createConversation.execute('user-1', 'org-1', 'space-1')).rejects.toBeInstanceOf(
      SpaceNotFoundInOrganizationError,
    );
    expect(notifier.events).toHaveLength(0);
  });
});

describe('GetChatHistoryUseCase', () => {
  it('returns the conversation messages oldest first', async () => {
    const { getChatHistory, conversations } = setup();
    const conversation = await conversations.create('space-1', 'user-1');
    await conversations.appendMessage({
      conversationId: conversation.id,
      role: 'user',
      content: 'pregunta',
    });
    await conversations.appendMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'respuesta',
    });

    const messages = await getChatHistory.execute('user-1', 'org-1', 'space-1', conversation.id);

    expect(messages.map((m) => m.content)).toEqual(['pregunta', 'respuesta']);
  });

  it("rejects another user's conversation and an unknown one", async () => {
    const { getChatHistory, conversations } = setup();
    const foreign = await conversations.create('space-1', 'user-2');

    await expect(
      getChatHistory.execute('user-1', 'org-1', 'space-1', foreign.id),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(
      getChatHistory.execute('user-1', 'org-1', 'space-1', 'conv-inexistente'),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
