import { useEffect } from 'react';
import { create } from 'zustand';
import { ApiError } from '@/lib/api';
import { subscribeRealtime, subscribeRealtimeReconnect } from '@/lib/realtime';
import { chatApiAdapter } from '../infra/http-chat-api.adapter';
import type { ChatMode } from '../domain/mode';
import type { Conversation } from '../domain/conversation';
import type { Message } from '../domain/message';

/**
 * Messages typed before a conversation exists (or when creating one
 * failed) are staged under a per-project draft key so they still render.
 */
function draftKey(projectId: string): string {
  return `draft:${projectId}`;
}

interface ChatStoreState {
  /** Conversation list per project, most recently active first. */
  conversationsByProject: Record<string, Conversation[]>;
  /** Projects whose list is loaded, with the org used to load it (for refetches). */
  loadedListOrganization: Record<string, string>;
  /**
   * Active conversation per project. `undefined` = never resolved (the
   * most recent one is auto-selected on load); `null` = empty chat.
   */
  activeConversationByProject: Record<string, string | null>;
  /** Messages per conversation id (or per draft key, see draftKey). */
  messagesByConversation: Record<string, Message[]>;
  /** Loaded conversations, with the coordinates needed to refetch them. */
  loadedMessageCoords: Record<string, { organizationId: string; projectId: string }>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  loadConversations: (organizationId: string, projectId: string, force?: boolean) => Promise<void>;
  loadMessages: (
    organizationId: string,
    projectId: string,
    conversationId: string,
    force?: boolean,
  ) => Promise<void>;
  selectConversation: (projectId: string, conversationId: string) => void;
  startNewConversation: (organizationId: string, projectId: string) => Promise<void>;
  sendMessage: (
    organizationId: string,
    projectId: string,
    content: string,
    mode: ChatMode,
    model: string | null,
  ) => Promise<void>;
}

/** Registers a freshly created conversation and makes it the active one. */
function withNewConversation(
  state: ChatStoreState,
  organizationId: string,
  projectId: string,
  conversation: Conversation,
): Partial<ChatStoreState> {
  return {
    conversationsByProject: {
      ...state.conversationsByProject,
      [projectId]: [conversation, ...(state.conversationsByProject[projectId] ?? [])],
    },
    activeConversationByProject: {
      ...state.activeConversationByProject,
      [projectId]: conversation.id,
    },
    // Brand new thread: nothing to fetch, but its refetch coordinates are
    // registered so SSE invalidations keep it in sync.
    loadedMessageCoords: {
      ...state.loadedMessageCoords,
      [conversation.id]: { organizationId, projectId },
    },
  };
}

/** Store holding conversations and messages per project. */
export const useChatStore = create<ChatStoreState>((set, get) => ({
  conversationsByProject: {},
  loadedListOrganization: {},
  activeConversationByProject: {},
  messagesByConversation: {},
  loadedMessageCoords: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,

  loadConversations: async (organizationId, projectId, force = false) => {
    if (!force && get().loadedListOrganization[projectId]) return;

    if (!force) set({ isLoadingConversations: true });
    try {
      const conversations = await chatApiAdapter.listConversations(organizationId, projectId);
      set((state) => {
        const currentActive = state.activeConversationByProject[projectId];
        return {
          isLoadingConversations: false,
          conversationsByProject: { ...state.conversationsByProject, [projectId]: conversations },
          loadedListOrganization: { ...state.loadedListOrganization, [projectId]: organizationId },
          activeConversationByProject: {
            ...state.activeConversationByProject,
            // First load of the project: the most recent thread is active.
            [projectId]: currentActive !== undefined ? currentActive : conversations[0]?.id ?? null,
          },
        };
      });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  loadMessages: async (organizationId, projectId, conversationId, force = false) => {
    if (!force && get().loadedMessageCoords[conversationId]) return;

    if (!force) set({ isLoadingMessages: true });
    try {
      const messages = await chatApiAdapter.getMessages(organizationId, projectId, conversationId);
      set((state) => ({
        isLoadingMessages: false,
        messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
        loadedMessageCoords: {
          ...state.loadedMessageCoords,
          [conversationId]: { organizationId, projectId },
        },
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  selectConversation: (projectId, conversationId) =>
    set((state) => ({
      activeConversationByProject: {
        ...state.activeConversationByProject,
        [projectId]: conversationId,
      },
    })),

  startNewConversation: async (organizationId, projectId) => {
    try {
      const conversation = await chatApiAdapter.createConversation(organizationId, projectId);
      set((state) => withNewConversation(state, organizationId, projectId, conversation));
    } catch {
      // Creation failed (backend down): the button simply has no effect.
    }
  },

  sendMessage: async (organizationId, projectId, content, mode, model) => {
    let conversationId = get().activeConversationByProject[projectId] ?? null;
    const stagingKey = conversationId ?? draftKey(projectId);

    appendMessage(set, stagingKey, {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    });
    set({ isSending: true });

    try {
      if (conversationId === null) {
        const conversation = await chatApiAdapter.createConversation(organizationId, projectId);
        conversationId = conversation.id;
        // The staged draft messages move into the real conversation.
        set((state) => {
          const { [stagingKey]: draft = [], ...rest } = state.messagesByConversation;
          return {
            ...withNewConversation(state, organizationId, projectId, conversation),
            messagesByConversation: { ...rest, [conversation.id]: draft },
          };
        });
      }

      const reply = await chatApiAdapter.sendMessage(
        organizationId,
        projectId,
        conversationId,
        content,
        mode,
        model,
      );
      appendMessage(set, conversationId, reply);
      // Title and ordering changed server-side: refresh the sidebar list
      // right away instead of waiting for the SSE roundtrip.
      void get().loadConversations(organizationId, projectId, true);
    } catch (error) {
      // The error is shown as an assistant reply so the conversation
      // thread is not lost (not persisted: local only).
      appendMessage(set, conversationId ?? stagingKey, {
        id: `local-error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${error instanceof ApiError ? error.message : 'No se pudo obtener respuesta, intentá de nuevo.'}`,
        createdAt: new Date().toISOString(),
      });
    } finally {
      set({ isSending: false });
    }
  },
}));

type ChatStoreSet = (
  updater: (state: ChatStoreState) => Partial<ChatStoreState>,
) => void;

/** Appends a message under a conversation/draft key, deduplicating by id
 * (an SSE-triggered refetch may land the message before the HTTP reply). */
function appendMessage(set: ChatStoreSet, key: string, message: Message): void {
  set((state) => {
    const current = state.messagesByConversation[key] ?? [];
    if (current.some((item) => item.id === message.id)) return {};
    return {
      messagesByConversation: { ...state.messagesByConversation, [key]: [...current, message] },
    };
  });
}

// ---------------------------------------------------------------------
// Realtime invalidation: conversation.updated only says WHAT changed; the
// store refetches through the regular API. Registered once at module
// scope so every loaded list/conversation stays fresh, even for projects
// whose sidebar section is not currently mounted.
// ---------------------------------------------------------------------

subscribeRealtime((event) => {
  if (event.type !== 'conversation.updated') return;
  const state = useChatStore.getState();

  if (state.loadedListOrganization[event.spaceId]) {
    void state.loadConversations(event.organizationId, event.spaceId, true);
  }
  if (state.loadedMessageCoords[event.conversationId]) {
    void state.loadMessages(event.organizationId, event.spaceId, event.conversationId, true);
  }
});

subscribeRealtimeReconnect(() => {
  const state = useChatStore.getState();
  for (const [projectId, organizationId] of Object.entries(state.loadedListOrganization)) {
    void state.loadConversations(organizationId, projectId, true);
  }
  for (const [conversationId, coords] of Object.entries(state.loadedMessageCoords)) {
    void state.loadMessages(coords.organizationId, coords.projectId, conversationId, true);
  }
});

/**
 * Chat history of a project for the sidebar: conversation list, active
 * selection and the "Nuevo chat" action.
 */
export function useConversationList(organizationId: string | null, projectId: string | null) {
  const conversationsByProject = useChatStore((state) => state.conversationsByProject);
  const activeConversationByProject = useChatStore((state) => state.activeConversationByProject);
  const isLoading = useChatStore((state) => state.isLoadingConversations);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const startNewConversation = useChatStore((state) => state.startNewConversation);

  useEffect(() => {
    if (organizationId && projectId) void loadConversations(organizationId, projectId);
  }, [organizationId, projectId, loadConversations]);

  return {
    conversations: projectId ? (conversationsByProject[projectId] ?? []) : [],
    activeConversationId: projectId
      ? (activeConversationByProject[projectId] ?? null)
      : null,
    isLoading,
    selectConversation: (conversationId: string) => {
      if (projectId) selectConversation(projectId, conversationId);
    },
    startNewConversation: () => {
      if (organizationId && projectId) void startNewConversation(organizationId, projectId);
    },
  };
}

/** Messages of the active conversation of a project (loads on demand). */
export function useConversation(organizationId: string | null, projectId: string | null) {
  const messagesByConversation = useChatStore((state) => state.messagesByConversation);
  const activeConversationByProject = useChatStore((state) => state.activeConversationByProject);
  const conversationsByProject = useChatStore((state) => state.conversationsByProject);
  const isLoading = useChatStore((state) => state.isLoadingMessages);
  const isSending = useChatStore((state) => state.isSending);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const loadMessages = useChatStore((state) => state.loadMessages);

  const activeConversationId = projectId
    ? (activeConversationByProject[projectId] ?? null)
    : null;

  useEffect(() => {
    if (organizationId && projectId) void loadConversations(organizationId, projectId);
  }, [organizationId, projectId, loadConversations]);

  useEffect(() => {
    if (organizationId && projectId && activeConversationId) {
      void loadMessages(organizationId, projectId, activeConversationId);
    }
  }, [organizationId, projectId, activeConversationId, loadMessages]);

  const messagesKey = activeConversationId ?? (projectId ? draftKey(projectId) : null);
  const activeConversation =
    projectId && activeConversationId
      ? (conversationsByProject[projectId] ?? []).find(
          (conversation) => conversation.id === activeConversationId,
        ) ?? null
      : null;

  return {
    messages: messagesKey ? (messagesByConversation[messagesKey] ?? []) : [],
    activeConversation,
    isLoading,
    isSending,
  };
}
